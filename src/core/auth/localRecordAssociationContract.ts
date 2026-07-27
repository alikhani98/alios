import {
  ACCOUNT_OWNED_SYNCABLE_ENTITIES,
} from "@/core/sync/profileContract";
import type { SyncableEntityName } from "@/core/sync/syncableEntities";

export type LocalRecordAssociationState =
  | "local-unowned"
  | "association-pending-confirmation"
  | "associated-local-only"
  | "sync-candidate"
  | "association-blocked"
  | "association-error";

export type LocalRecordClaimMode =
  | "explicit-claim-required"
  | "explicit-skip-allowed";

export type LocalRecordDuplicateStrategy =
  | "block-silent-duplicate"
  | "manual-review-before-sync";

export type LocalRecordMigrationRule = Readonly<{
  noDeletion: true;
  noOverwrite: true;
  noSilentMerge: true;
  backupFormatRemainsCompatible: true;
}>;

export type LocalRecordAssociationRuleSet = Readonly<{
  firstLogin: Readonly<{
    preLoginOwnership: "device-local-user";
    postLoginAssociation: "account-link-may-be-created";
    automaticClaim: false;
    confirmationRequired: true;
    claimMode: LocalRecordClaimMode;
    duplicateStrategy: LocalRecordDuplicateStrategy;
  }>;
  migration: LocalRecordMigrationRule;
  syncPreparation: Readonly<{
    syncCandidatesRequireAssociation: true;
    ownershipMetadataAttachment: "sidecar-sync-metadata-only";
    unsyncedAssociatedRecordsRemainLocalUntilExplicitSync: true;
    associationNeverChangesRepositoryRecordShape: true;
  }>;
  entities: Readonly<{
    associationEligibleEntities: ReadonlyArray<SyncableEntityName>;
    eligibilityOwnership: "account-record";
  }>;
}>;

export const DEFAULT_LOCAL_RECORD_MIGRATION_RULES: LocalRecordMigrationRule = {
  noDeletion: true,
  noOverwrite: true,
  noSilentMerge: true,
  backupFormatRemainsCompatible: true,
};

export const DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET: LocalRecordAssociationRuleSet =
  {
    firstLogin: {
      preLoginOwnership: "device-local-user",
      postLoginAssociation: "account-link-may-be-created",
      automaticClaim: false,
      confirmationRequired: true,
      claimMode: "explicit-claim-required",
      duplicateStrategy: "manual-review-before-sync",
    },
    migration: DEFAULT_LOCAL_RECORD_MIGRATION_RULES,
    syncPreparation: {
      syncCandidatesRequireAssociation: true,
      ownershipMetadataAttachment: "sidecar-sync-metadata-only",
      unsyncedAssociatedRecordsRemainLocalUntilExplicitSync: true,
      associationNeverChangesRepositoryRecordShape: true,
    },
    entities: {
      associationEligibleEntities: ACCOUNT_OWNED_SYNCABLE_ENTITIES,
      eligibilityOwnership: "account-record",
    },
  };

/**
 * Stage 214D defines how future account onboarding may associate existing local
 * repository records with a user identity.
 *
 * The contract is intentionally non-breaking: it introduces no runtime sync,
 * no account activation, no schema change, and no mutation of existing record
 * shapes or backup payloads.
 */
