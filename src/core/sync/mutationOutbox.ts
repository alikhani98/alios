import type { SyncConflictEntity } from "./types";

export type MutationOutboxEntity = SyncConflictEntity;
export type MutationOutboxOperation = "create" | "update" | "delete";
export type MutationOutboxStatus =
  | "pending"
  | "processing"
  | "retry-wait"
  | "blocked-conflict"
  | "acknowledged";

export type MutationOutboxEntry = Readonly<{
  id: string;
  entity: MutationOutboxEntity;
  operation: MutationOutboxOperation;
  recordId: string;
  payload?: Readonly<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  status: MutationOutboxStatus;
  attemptCount: number;
  nextAttemptAt?: string;
  lastAttemptAt?: string;
  processingStartedAt?: string;
  lastError?: string;
  idempotencyKey: string;
}>;

export type EnqueueMutationOutboxInput = Readonly<
  Pick<MutationOutboxEntry, "entity" | "operation" | "recordId"> &
    Partial<Pick<MutationOutboxEntry, "payload" | "deletedAt">>
>;

export type MutationOutboxProcessResult = Readonly<{
  acknowledged: number;
  retryWaiting: number;
  blockedConflicts: number;
}>;

export class MutationOutboxConflictError extends Error {
  readonly name = "MutationOutboxConflictError";

  constructor(message = "The mutation needs conflict review.") {
    super(message);
  }
}

export interface MutationOutboxRepository {
  enqueue(input: EnqueueMutationOutboxInput): Promise<MutationOutboxEntry>;
  list(): Promise<MutationOutboxEntry[]>;
  listPending(): Promise<MutationOutboxEntry[]>;
  getById(id: string): Promise<MutationOutboxEntry | undefined>;
  recoverExpiredProcessing(
    now: string,
    leaseTimeoutMs: number
  ): Promise<number>;
  listReady(now: string): Promise<MutationOutboxEntry[]>;
  claim(
    id: string,
    now: string,
    leaseTimeoutMs: number
  ): Promise<MutationOutboxEntry | undefined>;
  acknowledge(id: string, now: string): Promise<void>;
  markRetryWait(
    id: string,
    input: Readonly<{
      now: string;
      nextAttemptAt: string;
      error: string;
    }>
  ): Promise<void>;
  markBlockedConflict(
    id: string,
    input: Readonly<{ now: string; error: string }>
  ): Promise<void>;
}
