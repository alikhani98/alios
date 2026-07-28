import type {
  SyncConflictRecord,
  SyncConflictResolutionInput,
  SyncConflictResolutionResult,
  SyncProvider,
  SyncResult,
  SyncStateListener,
  SyncStateSubscription,
  SyncStatus,
} from "./types";

const localOnlyStatus: SyncStatus = {
  mode: "local-only",
  provider: "local-only",
  detail: "AliOS is currently running only on this device.",
};

export class LocalOnlySyncProvider implements SyncProvider {
  readonly name = "local-only";

  async getStatus(): Promise<SyncStatus> {
    return localOnlyStatus;
  }

  async syncNow(): Promise<SyncResult> {
    return { status: localOnlyStatus, changedRecords: 0 };
  }

  getConflictSnapshot(): ReadonlyArray<SyncConflictRecord> {
    return [];
  }

  async listConflicts(): Promise<ReadonlyArray<SyncConflictRecord>> {
    return [];
  }

  async resolveConflict(
    _input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult> {
    throw new Error(
      "AliOS cannot resolve sync conflicts while it is running in local-only mode."
    );
  }

  subscribe(_listener: SyncStateListener): SyncStateSubscription {
    return { unsubscribe: () => undefined };
  }
}

export const localOnlySyncProvider = new LocalOnlySyncProvider();
