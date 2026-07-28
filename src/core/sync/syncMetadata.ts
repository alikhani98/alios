import type { SyncableEntityName } from "./syncableEntities";

export type SyncDevicePlatform = "web";

export type SyncDeviceIdentity = Readonly<{
  deviceId: string;
  label: string;
  platform: SyncDevicePlatform;
  trust: "local-only" | "known-device";
}>;

export type SyncLifecycleState =
  | "local-only"
  | "available"
  | "paused"
  | "offline"
  | "conflict"
  | "error";

export type SyncLastOutcome = "never" | "success" | "error";

export type SyncMetadataSnapshot = Readonly<{
  device: SyncDeviceIdentity;
  state: SyncLifecycleState;
  lastSyncedAt?: string;
  lastAttemptAt?: string;
  lastOutcome: SyncLastOutcome;
}>;

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

export const LOCAL_ONLY_SYNC_DEVICE_IDENTITY: SyncDeviceIdentity = {
  deviceId: "local-device",
  label: "This device",
  platform: "web",
  trust: "local-only",
};

export const LOCAL_ONLY_SYNC_METADATA: SyncMetadataSnapshot = {
  device: LOCAL_ONLY_SYNC_DEVICE_IDENTITY,
  state: "local-only",
  lastOutcome: "never",
};

/**
 * Minimal contract for a future optional remote adapter.
 *
 * Stage 213A keeps AliOS local-only. These types define the shape of a future
 * sync payload without changing any repository, storage, backup, or UI behavior.
 */
