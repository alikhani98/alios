import { describe, expect, it } from "vitest";

import {
  PREFERENCE_REGISTRY,
  type PreferenceSyncCategory,
} from "@/shared/preferences";
import { DEFAULT_SYNC_RULE_SET } from "@/core/sync/profileContract";

import {
  AUTH_SYNC_READINESS_BY_PROFILE_STATUS,
  DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET,
  SESSION_EXCLUDED_PREFERENCE_CATEGORIES,
} from "../sessionLifecycleContract";

describe("auth session lifecycle contract", () => {
  it("keeps every preference category outside session storage", () => {
    const categories = new Set(
      PREFERENCE_REGISTRY.map((entry) => entry.category as PreferenceSyncCategory)
    );

    expect(categories).toEqual(
      new Set(SESSION_EXCLUDED_PREFERENCE_CATEGORIES)
    );
    expect(
      DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET.sessionStorage
        .preferencesContainSessionData
    ).toBe(false);
    expect(
      DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET.security.tokensStayOutOfPreferences
    ).toBe(true);
  });

  it("keeps session data out of backups and repository-owned app data", () => {
    expect(
      DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET.sessionStorage
        .backupContainsSessionData
    ).toBe(false);
    expect(
      DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET.security
        .sessionStateStaysOutsideRepositoryData
    ).toBe(true);
    expect(DEFAULT_SYNC_RULE_SET.exportImport.backupContainsRepositoryRecordsOnly).toBe(
      true
    );
  });

  it("requires an authenticated session and explicit sync setup before sync can enable", () => {
    expect(
      DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET.syncHandoff
        .syncRequiresAuthenticatedSession
    ).toBe(true);
    expect(
      DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET.syncHandoff
        .syncRequiresExplicitAccountSetup
    ).toBe(true);
    expect(AUTH_SYNC_READINESS_BY_PROFILE_STATUS.ready).toBe("enabled");
    expect(AUTH_SYNC_READINESS_BY_PROFILE_STATUS["local-only"]).toBe(
      "disabled"
    );
  });
});
