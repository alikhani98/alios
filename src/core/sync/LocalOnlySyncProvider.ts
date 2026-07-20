import type { SyncProvider, SyncResult, SyncStatus } from "./types";

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
}

export const localOnlySyncProvider = new LocalOnlySyncProvider();
