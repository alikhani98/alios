import { describe, expect, it } from "vitest";

import {
  ACCOUNT_OWNED_SYNCABLE_ENTITIES,
  DEFAULT_SYNC_RULE_SET,
} from "@/core/sync/profileContract";

import {
  DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET,
  DEFAULT_LOCAL_RECORD_MIGRATION_RULES,
} from "../localRecordAssociationContract";

describe("local record association contract", () => {
  it("keeps first-login claiming explicit and never automatic", () => {
    expect(DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET.firstLogin.automaticClaim).toBe(
      false
    );
    expect(
      DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET.firstLogin.confirmationRequired
    ).toBe(true);
    expect(DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET.firstLogin.claimMode).toBe(
      "explicit-claim-required"
    );
  });

  it("forbids destructive or silent migration behavior", () => {
    expect(DEFAULT_LOCAL_RECORD_MIGRATION_RULES.noDeletion).toBe(true);
    expect(DEFAULT_LOCAL_RECORD_MIGRATION_RULES.noOverwrite).toBe(true);
    expect(DEFAULT_LOCAL_RECORD_MIGRATION_RULES.noSilentMerge).toBe(true);
    expect(
      DEFAULT_LOCAL_RECORD_MIGRATION_RULES.backupFormatRemainsCompatible
    ).toBe(true);
  });

  it("keeps sync preparation separate from record shape and backup behavior", () => {
    expect(
      DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET.syncPreparation
        .ownershipMetadataAttachment
    ).toBe("sidecar-sync-metadata-only");
    expect(
      DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET.syncPreparation
        .associationNeverChangesRepositoryRecordShape
    ).toBe(true);
    expect(
      DEFAULT_LOCAL_RECORD_ASSOCIATION_RULE_SET.entities
        .associationEligibleEntities
    ).toEqual(ACCOUNT_OWNED_SYNCABLE_ENTITIES);
    expect(DEFAULT_SYNC_RULE_SET.exportImport.backupFormatVersionUnchanged).toBe(
      true
    );
  });
});
