import { describe, expect, it, vi } from "vitest";

import {
  LOCAL_ONLY_ACCOUNT_RUNTIME_STATE,
  LOCAL_ONLY_AUTH_SESSION,
  LOCAL_ONLY_SYNC_CAPABILITY,
  LOCAL_ONLY_SYNC_STATUS,
  localOnlyAccountRuntimeBoundary,
} from "../runtimeBoundary";

describe("account runtime boundary", () => {
  it("keeps the default runtime fully local-only", async () => {
    await expect(localOnlyAccountRuntimeBoundary.getState()).resolves.toMatchObject({
      localOnly: true,
      hasActiveAccount: false,
      accountStatus: "local-only",
      authStatus: "unauthenticated",
      identity: null,
      accountCapabilities: {
        status: "local-only",
        available: [],
      },
      syncCapability: {
        availability: "local-only",
        enabled: false,
      },
      syncStatus: {
        mode: "local-only",
        provider: "local-only",
      },
    });
  });

  it("exposes explicit local-only defaults for auth and sync without enabling user state", () => {
    expect(LOCAL_ONLY_AUTH_SESSION).toMatchObject({
      status: "unauthenticated",
      provider: "local-only",
      user: null,
    });
    expect(LOCAL_ONLY_SYNC_CAPABILITY).toMatchObject({
      availability: "local-only",
      enabled: false,
    });
    expect(LOCAL_ONLY_SYNC_STATUS).toMatchObject({
      mode: "local-only",
      provider: "local-only",
    });
    expect(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.hasActiveAccount).toBe(false);
  });

  it("supports runtime subscription without implying an active account session", () => {
    const listener = vi.fn();

    const subscription = localOnlyAccountRuntimeBoundary.subscribe(listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "local-only",
        providerId: "local-only",
        identity: null,
      })
    );

    expect(subscription.unsubscribe).toBeTypeOf("function");
    subscription.unsubscribe();
  });
});
