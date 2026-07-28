export type SyncMode = "local-only" | "ready" | "syncing" | "error";
export type SyncIssue = "conflict" | "connectivity" | "provider";

export type SyncScope = "preferences" | "tasks" | "projects" | "goals";

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
  subscribe(listener: SyncStateListener): SyncStateSubscription;
}
