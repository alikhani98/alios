export const USER_DATA_SYNC_TRIGGER_EVENT = "alios:user-data-sync-trigger";

export type UserDataSyncTriggerEntity =
  | "tasks"
  | "projects"
  | "goals"
  | "financeTransactions"
  | "financeObligations"
  | "manualEntries";

export type UserDataSyncTriggerDetail = Readonly<{
  entity: UserDataSyncTriggerEntity;
  operation: "create" | "update" | "delete";
}>;

export function notifyUserDataSyncTrigger(detail: UserDataSyncTriggerDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<UserDataSyncTriggerDetail>(USER_DATA_SYNC_TRIGGER_EVENT, {
      detail,
    })
  );
}
