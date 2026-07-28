import { describe, expect, it } from "vitest";

import { LOCAL_ONLY_ACCOUNT_RUNTIME_STATE } from "../runtimeBoundary";
import {
  createAccountRuntimeStateStore,
  selectAccountRuntimeStatus,
  selectAuthSessionStatus,
  selectSyncCapabilityStatus,
  selectSyncStatus,
} from "../runtimeStateStore";

describe("account runtime state store", () => {
  it("starts in the same local-only state exposed by the runtime boundary", () => {
    const store = createAccountRuntimeStateStore();

    expect(store.getState()).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
    expect(store.getSnapshot()).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
  });

  it("returns stable reads without activating account or sync state", async () => {
    const store = createAccountRuntimeStateStore();

    const beforeRefresh = store.getSnapshot();
    const refreshed = await store.refresh();
    const afterRefresh = store.getSnapshot();

    expect(beforeRefresh).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
    expect(refreshed).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
    expect(afterRefresh).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
    expect(afterRefresh.hasActiveAccount).toBe(false);
    expect(afterRefresh.localOnly).toBe(true);
    expect(afterRefresh.syncCapability.enabled).toBe(false);
    expect(afterRefresh.syncStatus.mode).toBe("local-only");
  });

  it("exposes selector helpers for future runtime consumers", () => {
    const store = createAccountRuntimeStateStore();
    const state = store.getState();

    expect(selectAccountRuntimeStatus(state)).toBe("local-only");
    expect(selectAuthSessionStatus(state)).toBe("unauthenticated");
    expect(selectSyncCapabilityStatus(state)).toMatchObject({
      availability: "local-only",
      enabled: false,
    });
    expect(selectSyncStatus(state)).toMatchObject({
      mode: "local-only",
      provider: "local-only",
    });
  });
});
