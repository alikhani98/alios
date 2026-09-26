import type {
  EnqueueMutationOutboxInput,
  MutationOutboxEntry,
  MutationOutboxRepository,
} from "@/core/sync/mutationOutbox";
import type { AliosDatabase } from "../db";

export class DexieMutationOutboxRepository
  implements MutationOutboxRepository
{
  constructor(private readonly database: AliosDatabase) {}

  async enqueue(
    input: EnqueueMutationOutboxInput
  ): Promise<MutationOutboxEntry> {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    const entry: MutationOutboxEntry = {
      ...input,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "pending",
      attemptCount: 0,
      idempotencyKey: id,
      ...(input.operation === "delete"
        ? { deletedAt: input.deletedAt ?? timestamp }
        : {}),
    };
    await this.database.mutationOutbox.add(entry);
    return entry;
  }

  async list(): Promise<MutationOutboxEntry[]> {
    return this.database.mutationOutbox.toArray();
  }

  async listPending(): Promise<MutationOutboxEntry[]> {
    return this.database.mutationOutbox
      .where("status")
      .equals("pending")
      .toArray();
  }

  async getById(id: string): Promise<MutationOutboxEntry | undefined> {
    return this.database.mutationOutbox.get(id);
  }

  async recoverExpiredProcessing(
    now: string,
    leaseTimeoutMs: number
  ): Promise<number> {
    return this.database.transaction(
      "rw",
      this.database.mutationOutbox,
      async () => {
        const processingEntries = await this.database.mutationOutbox
          .where("status")
          .equals("processing")
          .toArray();
        let recoveredCount = 0;

        for (const entry of processingEntries) {
          const startedAt = entry.processingStartedAt
            ? Date.parse(entry.processingStartedAt)
            : Number.NaN;
          if (
            !Number.isFinite(startedAt) ||
            Date.parse(now) - startedAt < leaseTimeoutMs
          ) {
            continue;
          }

          const current = await this.database.mutationOutbox.get(entry.id);
          if (
            !current ||
            current.status !== "processing" ||
            current.processingStartedAt !== entry.processingStartedAt
          ) {
            continue;
          }

          await this.database.mutationOutbox.put({
            ...current,
            status: "pending",
            updatedAt: now,
            processingStartedAt: undefined,
            nextAttemptAt: undefined,
            lastError: "Processing lease expired; retrying.",
          });
          recoveredCount += 1;
        }

        return recoveredCount;
      }
    );
  }

  async listReady(now: string): Promise<MutationOutboxEntry[]> {
    const entries = await this.database.mutationOutbox.toArray();
    const nowMs = Date.parse(now);
    const blockedRecordKeys = new Set<string>();

    return entries.sort(compareMutationOutboxEntries).filter((entry) => {
      const recordKey = getMutationOutboxRecordKey(entry);
      if (blockedRecordKeys.has(recordKey)) {
        return false;
      }

      if (entry.status === "acknowledged") {
        return false;
      }

      if (
        entry.status === "processing" ||
        entry.status === "blocked-conflict"
      ) {
        blockedRecordKeys.add(recordKey);
        return false;
      }

      if (entry.status === "pending") {
        return true;
      }

      if (entry.status === "retry-wait") {
        if (!entry.nextAttemptAt) {
          return true;
        }
        const nextAttemptAt = Date.parse(entry.nextAttemptAt);
        if (Number.isFinite(nextAttemptAt) && nextAttemptAt <= nowMs) {
          return true;
        }
        blockedRecordKeys.add(recordKey);
      }

      return false;
    });
  }

  async claim(
    id: string,
    now: string,
    _leaseTimeoutMs: number
  ): Promise<MutationOutboxEntry | undefined> {
    return this.database.transaction(
      "rw",
      this.database.mutationOutbox,
      async () => {
        const entry = await this.database.mutationOutbox.get(id);
        if (!entry) {
          return undefined;
        }

        const nowMs = Date.parse(now);
        const ready =
          entry.status === "pending" ||
          (entry.status === "retry-wait" &&
            (!entry.nextAttemptAt || Date.parse(entry.nextAttemptAt) <= nowMs));
        if (!ready) {
          return undefined;
        }

        const earlierUnacknowledgedEntry = (
          await this.database.mutationOutbox.toArray()
        ).some(
          (candidate) =>
            candidate.id !== entry.id &&
            getMutationOutboxRecordKey(candidate) ===
              getMutationOutboxRecordKey(entry) &&
            compareMutationOutboxEntries(candidate, entry) < 0 &&
            candidate.status !== "acknowledged"
        );
        if (earlierUnacknowledgedEntry) {
          return undefined;
        }

        const claimed: MutationOutboxEntry = {
          ...entry,
          status: "processing",
          updatedAt: now,
          lastAttemptAt: now,
          processingStartedAt: now,
          attemptCount: entry.attemptCount + 1,
          nextAttemptAt: undefined,
        };
        await this.database.mutationOutbox.put(claimed);
        return claimed;
      }
    );
  }

  async acknowledge(id: string, now: string): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.mutationOutbox,
      async () => {
        const entry = await this.database.mutationOutbox.get(id);
        if (!entry || entry.status !== "processing") {
          return;
        }
        await this.database.mutationOutbox.put({
          ...entry,
          status: "acknowledged",
          updatedAt: now,
          processingStartedAt: undefined,
          nextAttemptAt: undefined,
          lastError: undefined,
        });
      }
    );
  }

  async markRetryWait(
    id: string,
    input: Readonly<{
      now: string;
      nextAttemptAt: string;
      error: string;
    }>
  ): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.mutationOutbox,
      async () => {
        const entry = await this.database.mutationOutbox.get(id);
        if (!entry || entry.status !== "processing") {
          return;
        }
        await this.database.mutationOutbox.put({
          ...entry,
          status: "retry-wait",
          updatedAt: input.now,
          processingStartedAt: undefined,
          nextAttemptAt: input.nextAttemptAt,
          lastError: input.error,
        });
      }
    );
  }

  async markBlockedConflict(
    id: string,
    input: Readonly<{ now: string; error: string }>
  ): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.mutationOutbox,
      async () => {
        const entry = await this.database.mutationOutbox.get(id);
        if (!entry || entry.status !== "processing") {
          return;
        }
        await this.database.mutationOutbox.put({
          ...entry,
          status: "blocked-conflict",
          updatedAt: input.now,
          processingStartedAt: undefined,
          nextAttemptAt: undefined,
          lastError: input.error,
        });
      }
    );
  }
}

function compareMutationOutboxEntries(
  left: MutationOutboxEntry,
  right: MutationOutboxEntry
) {
  return (
    left.entity.localeCompare(right.entity) ||
    left.recordId.localeCompare(right.recordId) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function getMutationOutboxRecordKey(entry: MutationOutboxEntry) {
  return `${entry.entity}\u0000${entry.recordId}`;
}
