import { describe, expect, it } from "vitest";

import { OPTIONAL_SYNC_PROVIDER_ID, assessOptionalSyncConsent } from "../optionalSyncConsent";

describe("optional sync consent boundary", () => {
  it("keeps the future provider choice explicit without configuring it", () => {
    expect(OPTIONAL_SYNC_PROVIDER_ID).toBe("supabase");
  });

  it("blocks remote activation until every local-first safeguard is satisfied", () => {
    expect(
      assessOptionalSyncConsent({
        hasAccount: false,
        hasExplicitConsent: false,
        hasDisclosedDataScope: false,
        keepsLocalCopy: true,
        preservesBackupCompatibility: true,
      })
    ).toEqual({
      eligible: false,
      missing: ["account", "explicit-consent", "data-scope-disclosure"],
    });
  });

  it("permits a future adapter only after the full consent contract is met", () => {
    expect(
      assessOptionalSyncConsent({
        hasAccount: true,
        hasExplicitConsent: true,
        hasDisclosedDataScope: true,
        keepsLocalCopy: true,
        preservesBackupCompatibility: true,
      })
    ).toEqual({ eligible: true, missing: [] });
  });
});
