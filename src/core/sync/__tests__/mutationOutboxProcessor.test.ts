import { describe, expect, it } from "vitest";

import {
  MutationOutboxConflictError,
  type MutationOutboxEntry,
  type MutationOutboxRepository,
} from "../mutationOutbox";
import {
  getMutationOutboxRetryDelayMs,
  MutationOutboxProcessor,
} from "../mutationOutboxProcessor";

class InMemoryMutationOutboxRepository
  implements MutationOutboxRepository
{
  entries: MutationOutboxEntry[];

  constructor(entries: MutationOutboxEntry[]) {
    this.entries = entries;
  }

  async enqueue(): Promise<MutationOutboxEntry> {
    throw new Error("Not implemented in this test.");
  }

  async list() {
    return [...this.entries];
  }

  async listPending() {
    return this.entries.filter((entry) => entry.status === "pending");
  }

  async getById(id: string) {
    return this.entries.find((entry) => entry.id === id);
  }

  async recoverExpiredProcessing(now: string, leaseTimeoutMs: number) {
    const nowMs = Date.parse(now);
    let recovered = 0;
    this.entries = this.entries.map((entry) => {
      const startedAt = entry.processingStartedAt
        ? Date.parse(entry.processingStartedAt)
        : Number.NaN;
      if (
        entry.status !== "processing" ||
        !Number.isFinite(startedAt) ||
        nowMs - startedAt < leaseTimeoutMs
      ) {
        return entry;
      }
      recovered += 1;
      return {
        ...entry,
        status: "pending",
        updatedAt: now,
        processingStartedAt: undefined,
        nextAttemptAt: undefined,
      };
    });
    return recovered;
  }

  async listReady(now: string) {
    const nowMs = Date.parse(now);
    const blockedRecordKeys = new Set<string>();
    return this.entries
      .sort(
        (left, right) =>
          left.entity.localeCompare(right.entity) ||
          left.recordId.localeCompare(right.recordId) ||
          left.createdAt.localeCompare(right.createdAt)
      )
      .filter((entry) => {
        const recordKey = `${entry.entity}\u0000${entry.recordId}`;
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
        if (
          entry.status === "retry-wait" &&
          (!entry.nextAttemptAt || Date.parse(entry.nextAttemptAt) <= nowMs)
        ) {
          return true;
        }
        blockedRecordKeys.add(recordKey);
        return false;
      })
  }

  async claim(id: string, now: string) {
    const entry = this.entries.find((candidate) => candidate.id === id);
    if (
      !entry ||
      (entry.status !== "pending" && entry.status !== "retry-wait")
    ) {
      return undefined;
    }
    const earlierUnacknowledgedEntry = this.entries.some(
      (candidate) =>
        candidate.id !== entry.id &&
        candidate.entity === entry.entity &&
        candidate.recordId === entry.recordId &&
        candidate.createdAt < entry.createdAt &&
        candidate.status !== "acknowledged"
    );
    if (earlierUnacknowledgedEntry) {
      return undefined;
    }
    const claimed = {
      ...entry,
      status: "processing" as const,
      updatedAt: now,
      lastAttemptAt: now,
      processingStartedAt: now,
      attemptCount: entry.attemptCount + 1,
      nextAttemptAt: undefined,
    };
    this.entries = this.entries.map((candidate) =>
      candidate.id === id ? claimed : candidate
    );
    return claimed;
  }

  async acknowledge(id: string, now: string) {
    this.entries = this.entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status: "acknowledged" as const,
            updatedAt: now,
            processingStartedAt: undefined,
            nextAttemptAt: undefined,
          }
        : entry
    );
  }

  async markRetryWait(
    id: string,
    input: { now: string; nextAttemptAt: string; error: string }
  ) {
    this.entries = this.entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status: "retry-wait" as const,
            updatedAt: input.now,
            processingStartedAt: undefined,
            nextAttemptAt: input.nextAttemptAt,
            lastError: input.error,
          }
        : entry
    );
  }

  async markBlockedConflict(id: string, input: { now: string; error: string }) {
    this.entries = this.entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status: "blocked-conflict" as const,
            updatedAt: input.now,
            processingStartedAt: undefined,
            lastError: input.error,
          }
        : entry
    );
  }
}

function entry(
  id: string,
  input: Partial<MutationOutboxEntry> = {}
): MutationOutboxEntry {
  return {
    id,
    entity: "tasks",
    operation: "update",
    recordId: id,
    createdAt: "2026-09-26T10:00:00.000Z",
    updatedAt: "2026-09-26T10:00:00.000Z",
    status: "pending",
    attemptCount: 0,
    idempotencyKey: id,
    ...input,
  };
}

describe("MutationOutboxProcessor", () => {
  it("processes ready entries ordered by entity, record, and creation time", async () => {
    const repository = new InMemoryMutationOutboxRepository([
      entry("later", {
        entity: "tasks",
        recordId: "task-1",
        createdAt: "2026-09-26T10:02:00.000Z",
      }),
      entry("project", {
        entity: "projects",
        recordId: "project-1",
      }),
      entry("earlier", {
        entity: "tasks",
        recordId: "task-1",
        createdAt: "2026-09-26T10:01:00.000Z",
      }),
    ]);
    const processed: string[] = [];
    const processor = new MutationOutboxProcessor({
      repository,
      processEntry: async (current) => {
        processed.push(current.id);
      },
      now: () => new Date("2026-09-26T10:03:00.000Z"),
    });

    await expect(processor.processPending()).resolves.toEqual({
      acknowledged: 3,
      retryWaiting: 0,
      blockedConflicts: 0,
    });
    expect(processed).toEqual(["earlier", "later", "project"]);
  });

  it("moves network failures to retry-wait with exponential backoff and jitter", async () => {
    const repository = new InMemoryMutationOutboxRepository([entry("retry")]);
    const processor = new MutationOutboxProcessor({
      repository,
      processEntry: async () => {
        throw new Error("network timeout");
      },
      now: () => new Date("2026-09-26T10:00:00.000Z"),
      random: () => 0.5,
    });

    await expect(processor.processPending()).rejects.toThrow("network timeout");
    expect(repository.entries[0]).toMatchObject({
      status: "retry-wait",
      attemptCount: 1,
      nextAttemptAt: "2026-09-26T10:00:05.000Z",
    });
    expect(getMutationOutboxRetryDelayMs(4, () => 0.5)).toBe(30 * 60 * 1000);
  });

  it("blocks non-retryable conflicts instead of retrying forever", async () => {
    const repository = new InMemoryMutationOutboxRepository([entry("blocked")]);
    const processor = new MutationOutboxProcessor({
      repository,
      processEntry: async () => {
        throw new MutationOutboxConflictError("review required");
      },
      now: () => new Date("2026-09-26T10:00:00.000Z"),
    });

    await expect(processor.processPending()).resolves.toEqual({
      acknowledged: 0,
      retryWaiting: 0,
      blockedConflicts: 1,
    });
    expect(repository.entries[0]).toMatchObject({
      status: "blocked-conflict",
      lastError: "review required",
    });
  });
});
