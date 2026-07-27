import type { SyncableEntityName } from "./syncableEntities";

export type SyncCursor = Readonly<{
  provider: string;
  value: string;
  capturedAt: string;
}>;

export type SyncRecordEnvelope<TRecord> = Readonly<{
  entity: SyncableEntityName;
  recordId: string;
  updatedAt: string;
  deletedAt?: string;
  record: TRecord;
}>;

export type SyncBatch = Readonly<{
  cursor?: SyncCursor;
  records: ReadonlyArray<SyncRecordEnvelope<unknown>>;
}>;

/**
 * Minimal contract for a future optional remote adapter.
 *
 * Stage 213A keeps AliOS local-only. These types define the shape of a future
 * sync payload without changing any repository, storage, backup, or UI behavior.
 */
