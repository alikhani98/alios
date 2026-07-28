export type SyncMode = "local-only" | "ready" | "syncing" | "error";
export type SyncIssue = "conflict" | "connectivity" | "provider";

export type SyncScope = "preferences" | "tasks" | "projects" | "goals";
export type SyncConflictEntity = Exclude<SyncScope, "preferences">;
export type SyncConflictResolutionChoice = "keep-local" | "keep-remote";

export type SyncStatus = Readonly<{
  mode: SyncMode;
  provider: string;
  connectedUserId?: string;
  deviceId?: string;
  deviceLabel?: string;
  lastSyncedAt?: string;
  lastAttemptAt?: string;
  scopes?: ReadonlyArray<SyncScope>;
  conflictCount?: number;
  issue?: SyncIssue;
  detail: string;
}>;

export type SyncConflictRecord = Readonly<{
  entity: SyncConflictEntity;
  recordId: string;
  title: string;
  conflictAt: string;
  conflictReason?: string;
  localUpdatedAt: string;
  localLastSyncedAt?: string;
  localDeviceId?: string;
  localDeviceLabel: string;
  remoteUpdatedAt: string;
  remoteLastSyncedAt?: string;
  remoteDeviceId?: string;
  remoteDeviceLabel: string;
}>;

export type SyncConflictResolutionInput = Readonly<{
  entity: SyncConflictEntity;
  recordId: string;
  resolution: SyncConflictResolutionChoice;
}>;

export type SyncConflictResolutionResult = Readonly<{
  status: SyncStatus;
  conflict: SyncConflictRecord;
  resolution: SyncConflictResolutionChoice;
}>;

export type SyncResult = Readonly<{
  status: SyncStatus;
  changedRecords: number;
}>;

export type SyncStateListener = (status: SyncStatus) => void;

export type SyncStateSubscription = Readonly<{
  unsubscribe: () => void;
}>;

/**
 * Future remote adapters must preserve the local-first storage boundary.
 * The current implementation deliberately has no remote adapter.
 */
export interface SyncProvider {
  readonly name: string;
  getStatus(): Promise<SyncStatus>;
  syncNow(): Promise<SyncResult>;
  getConflictSnapshot?(): ReadonlyArray<SyncConflictRecord>;
  listConflicts?(): Promise<ReadonlyArray<SyncConflictRecord>>;
  resolveConflict?(
    input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult>;
  subscribe(listener: SyncStateListener): SyncStateSubscription;
}
