import { describe, expect, it } from "vitest";

import {
  GOOGLE_ACCOUNT_PROVIDER_ID,
  LOCAL_ONLY_ACCOUNT_CAPABILITIES,
  LOCAL_ONLY_ACCOUNT_CAPABILITY_SET,
  type AccountIdentity,
  type AccountSessionBoundary,
} from "../types";

describe("account abstraction types", () => {
  it("keeps the local-only capability set empty by default", () => {
    expect(LOCAL_ONLY_ACCOUNT_CAPABILITIES).toEqual([]);
    expect(LOCAL_ONLY_ACCOUNT_CAPABILITY_SET).toMatchObject({
      status: "local-only",
      available: [],
    });
  });

  it("supports a contract-only authenticated session shape", () => {
    const identity: AccountIdentity = {
      accountId: "account-1",
      email: "user@example.com",
      displayName: "AliOS User",
      providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
      metadata: {
        googleSubject: "google-sub-1",
        avatarUrl: "https://example.com/avatar.png",
      },
    };

    const session: AccountSessionBoundary = {
      status: "authenticated",
      identity,
      providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
      lifecycle: "signed-in",
      expiresAt: "2026-07-29T00:00:00.000Z",
      lastAuthenticatedAt: "2026-07-28T00:00:00.000Z",
    };

    expect(session.identity?.accountId).toBe("account-1");
    expect(session.status).toBe("authenticated");
    expect(session.lifecycle).toBe("signed-in");
    expect(session.identity?.providerId).toBe(GOOGLE_ACCOUNT_PROVIDER_ID);
  });
});
