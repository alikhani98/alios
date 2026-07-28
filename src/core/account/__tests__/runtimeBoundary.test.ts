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
      accountProviderId: "local-only",
      localOnly: true,
      hasActiveAccount: false,
      accountStatus: "local-only",
      authStatus: "unauthenticated",
      sessionLifecycle: "local-only",
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
      syncMetadata: {
        state: "local-only",
        lastOutcome: "never",
        device: {
          deviceId: "local-device",
          label: "This device",
        },
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
    expect(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.sessionLifecycle).toBe("local-only");
    expect(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.syncMetadata.lastOutcome).toBe("never");
  });

  it("supports runtime subscription without implying an active account session", async () => {
    const listener = vi.fn();

    const subscription = localOnlyAccountRuntimeBoundary.subscribe(listener);
    for (let attempt = 0; attempt < 5 && listener.mock.calls.length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        accountStatus: "local-only",
        authStatus: "unauthenticated",
        accountProviderId: "local-only",
        sessionLifecycle: "local-only",
        identity: null,
        localOnly: true,
      })
    );

    expect(subscription.unsubscribe).toBeTypeOf("function");
    subscription.unsubscribe();
  });

  it("exposes a local-only sync action without activating any remote behavior", async () => {
    await expect(localOnlyAccountRuntimeBoundary.syncNow()).resolves.toMatchObject({
      mode: "local-only",
      provider: "local-only",
    });
  });
});
