export type SyncMode = "local-only" | "ready" | "syncing" | "error";

export type SyncStatus = Readonly<{
  mode: SyncMode;
  provider: string;
  lastSyncedAt?: string;
  detail: string;
}>;

export type SyncResult = Readonly<{
  status: SyncStatus;
  changedRecords: number;
}>;

/**
 * Future remote adapters must preserve the local-first storage boundary.
 * The current implementation deliberately has no remote adapter.
 */
export interface SyncProvider {
  readonly name: string;
  getStatus(): Promise<SyncStatus>;
  syncNow(): Promise<SyncResult>;
}
