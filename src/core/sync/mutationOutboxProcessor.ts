import {
  type MutationOutboxEntry,
  type MutationOutboxProcessResult,
  type MutationOutboxRepository,
} from "./mutationOutbox";

export const MUTATION_OUTBOX_PROCESSING_LEASE_MS = 2 * 60 * 1000;
export const MUTATION_OUTBOX_RETRY_DELAYS_MS = [
  5 * 1000,
  30 * 1000,
  5 * 60 * 1000,
  30 * 60 * 1000,
] as const;
export const MUTATION_OUTBOX_MAX_RETRY_DELAY_MS =
  MUTATION_OUTBOX_RETRY_DELAYS_MS[
    MUTATION_OUTBOX_RETRY_DELAYS_MS.length - 1
  ];

type MutationOutboxProcessorDependencies = Readonly<{
  repository: MutationOutboxRepository;
  processEntry: (entry: MutationOutboxEntry) => Promise<void>;
  now?: () => Date;
  random?: () => number;
  leaseTimeoutMs?: number;
}>;

export class MutationOutboxProcessor {
  private readonly repository: MutationOutboxRepository;
  private readonly processEntry: (
    entry: MutationOutboxEntry
  ) => Promise<void>;
  private readonly now: () => Date;
  private readonly random: () => number;
  private readonly leaseTimeoutMs: number;

  constructor(dependencies: MutationOutboxProcessorDependencies) {
    this.repository = dependencies.repository;
    this.processEntry = dependencies.processEntry;
    this.now = dependencies.now ?? (() => new Date());
    this.random = dependencies.random ?? Math.random;
    this.leaseTimeoutMs =
      dependencies.leaseTimeoutMs ?? MUTATION_OUTBOX_PROCESSING_LEASE_MS;
  }

  async processPending(): Promise<MutationOutboxProcessResult> {
    const recoveryNow = this.now().toISOString();
    await this.repository.recoverExpiredProcessing(
      recoveryNow,
      this.leaseTimeoutMs
    );

    const entries = await this.repository.listReady(recoveryNow);
    let acknowledged = 0;
    let retryWaiting = 0;
    let blockedConflicts = 0;

    for (const entry of entries) {
      const claimNow = this.now().toISOString();
      const claimed = await this.repository.claim(
        entry.id,
        claimNow,
        this.leaseTimeoutMs
      );
      if (!claimed) {
        continue;
      }

      try {
        await this.processEntry(claimed);
        await this.repository.acknowledge(
          claimed.id,
          this.now().toISOString()
        );
        acknowledged += 1;
      } catch (error) {
        const errorMessage = toMutationErrorMessage(error);
        if (isRetryableMutationOutboxError(error)) {
          const now = this.now();
          const nextAttemptAt = new Date(
            now.getTime() +
              getMutationOutboxRetryDelayMs(claimed.attemptCount, this.random)
          ).toISOString();
          await this.repository.markRetryWait(claimed.id, {
            now: now.toISOString(),
            nextAttemptAt,
            error: errorMessage,
          });
          retryWaiting += 1;
          throw error;
        }

        await this.repository.markBlockedConflict(claimed.id, {
          now: this.now().toISOString(),
          error: errorMessage,
        });
        blockedConflicts += 1;
      }
    }

    return {
      acknowledged,
      retryWaiting,
      blockedConflicts,
    };
  }
}

export function getMutationOutboxRetryDelayMs(
  attemptCount: number,
  random: () => number = Math.random
) {
  const index = Math.max(0, Math.min(attemptCount - 1, 3));
  const baseDelay =
    MUTATION_OUTBOX_RETRY_DELAYS_MS[index] ??
    MUTATION_OUTBOX_MAX_RETRY_DELAY_MS;
  const jitter = 0.8 + Math.min(1, Math.max(0, random())) * 0.4;
  return Math.min(
    MUTATION_OUTBOX_MAX_RETRY_DELAY_MS,
    Math.round(baseDelay * jitter)
  );
}

export function isRetryableMutationOutboxError(error: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  const message = toMutationErrorMessage(error).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504")
  );
}

function toMutationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return String(error || "Mutation outbox processing failed.");
}
