import type { PreferenceSyncCategory } from "@/shared/preferences";

import type { SyncableEntityName } from "./syncableEntities";

export type SyncIdentityProvider = "email-password" | "magic-link" | "oauth";

export type SyncConflictResolutionStrategy =
  | "last-write-wins"
  | "field-merge"
  | "manual-review";

export type SyncOwnershipClass =
  | "account-record"
  | "account-preference"
  | "device-preference"
  | "intentionally-unsynced";

export type SyncProfileStatus =
  | "local-only"
  | "provisioning"
  | "ready"
  | "paused"
  | "error";

export type SyncUserProfile = Readonly<{
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  profileVersion: number;
  metadata: Readonly<{
    locale?: string;
    timezone?: string;
    preferredIdentityProvider?: SyncIdentityProvider;
  }>;
}>;

export type SyncOwnershipDescriptor = Readonly<{
  key: string;
  ownership: SyncOwnershipClass;
  notes: string;
}>;

export type SyncRuleSet = Readonly<{
  records: Readonly<{
    syncableEntities: ReadonlyArray<SyncableEntityName>;
    ownership: "account-record";
    conflictStrategy: SyncConflictResolutionStrategy;
    keepsLocalCopy: true;
  }>;
  preferences: Readonly<{
    syncCategoryMap: Readonly<Record<PreferenceSyncCategory, SyncOwnershipClass>>;
    keepsLocalCopy: true;
  }>;
  offline: Readonly<{
    localWritesRemainAuthoritative: true;
    remoteSyncRequiresExplicitAccountSetup: true;
    queuedUploadAllowed: true;
    backgroundMutationForbidden: true;
  }>;
  exportImport: Readonly<{
    backupRemainsLocalFirst: true;
    backupFormatVersionUnchanged: true;
    backupContainsRepositoryRecordsOnly: true;
    localPreferencesMayRemainOutsideBackup: true;
  }>;
}>;

export const DEFAULT_SYNC_CONFLICT_STRATEGY: SyncConflictResolutionStrategy =
  "last-write-wins";

export const ACCOUNT_OWNED_SYNCABLE_ENTITIES = [
  "dailyCheckins",
  "tasks",
  "projects",
  "journalEntries",
  "knowledgeItems",
  "settings",
  "inboxItems",
  "financeTransactions",
  "financeObligations",
  "decisionLogEntries",
  "manualEntries",
  "goals",
  "lifeAreas",
  "routines",
  "weeklyPlans",
] as const satisfies ReadonlyArray<SyncableEntityName>;

export const PREFERENCE_SYNC_CATEGORY_OWNERSHIP: Readonly<
  Record<PreferenceSyncCategory, SyncOwnershipClass>
> = {
  "account-synced": "account-preference",
  "device-local": "device-preference",
  "intentionally-unsynced": "intentionally-unsynced",
};

export const DEFAULT_SYNC_RULE_SET: SyncRuleSet = {
  records: {
    syncableEntities: ACCOUNT_OWNED_SYNCABLE_ENTITIES,
    ownership: "account-record",
    conflictStrategy: DEFAULT_SYNC_CONFLICT_STRATEGY,
    keepsLocalCopy: true,
  },
  preferences: {
    syncCategoryMap: PREFERENCE_SYNC_CATEGORY_OWNERSHIP,
    keepsLocalCopy: true,
  },
  offline: {
    localWritesRemainAuthoritative: true,
    remoteSyncRequiresExplicitAccountSetup: true,
    queuedUploadAllowed: true,
    backgroundMutationForbidden: true,
  },
  exportImport: {
    backupRemainsLocalFirst: true,
    backupFormatVersionUnchanged: true,
    backupContainsRepositoryRecordsOnly: true,
    localPreferencesMayRemainOutsideBackup: true,
  },
};

/**
 * Stage 213C defines the future account and sync contract only.
 *
 * These types and constants describe ownership and synchronization boundaries
 * without creating a runtime account, remote session, or network dependency.
 */
