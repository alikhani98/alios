import { describe, expect, it } from "vitest";

import {
  LOCAL_ONLY_ACCOUNT_CAPABILITIES,
  LOCAL_ONLY_ACCOUNT_CAPABILITY_SET,
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
    const session: AccountSessionBoundary = {
      status: "authenticated",
      identity: {
        accountId: "account-1",
        email: "user@example.com",
        displayName: "AliOS User",
        providerId: "future-provider",
      },
      providerId: "future-provider",
      expiresAt: "2026-07-29T00:00:00.000Z",
    };

    expect(session.identity?.accountId).toBe("account-1");
    expect(session.status).toBe("authenticated");
  });
});
