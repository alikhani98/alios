// @vitest-environment jsdom
import { StrictMode, act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { LOCAL_ONLY_ACCOUNT_RUNTIME_STATE } from "../runtimeBoundary";
import {
  createAccountRuntimeStateStore,
  selectAccountRuntimeStatus,
  selectAuthSessionStatus,
  selectSyncCapabilityStatus,
  selectSyncStatus,
  useAccountRuntimeState,
} from "../runtimeStateStore";
import type { AccountRuntimeBoundary, AccountRuntimeState } from "../runtimeBoundary";

function createBoundaryHarness(state: AccountRuntimeState = LOCAL_ONLY_ACCOUNT_RUNTIME_STATE) {
  let currentState = state;
  let activeSubscriptions = 0;
  let maxActiveSubscriptions = 0;
  let subscribeCalls = 0;
  let unsubscribeCalls = 0;
  const listeners = new Set<(nextState: AccountRuntimeState) => void>();

  const boundary: AccountRuntimeBoundary = {
    getState: async () => currentState,
    syncNow: async () => currentState.syncStatus,
    getSyncConflictSnapshot: () => [],
    getSyncConflicts: async () => [],
    resolveSyncConflict: async () => null,
    subscribe(listener) {
      subscribeCalls += 1;
      activeSubscriptions += 1;
      maxActiveSubscriptions = Math.max(
        maxActiveSubscriptions,
        activeSubscriptions
      );
      listeners.add(listener);
      listener(currentState);

      return {
        unsubscribe: () => {
          if (!listeners.delete(listener)) {
            return;
          }
          activeSubscriptions -= 1;
          unsubscribeCalls += 1;
        },
      };
    },
  };

  return {
    boundary,
    emit(nextState: AccountRuntimeState) {
      currentState = nextState;
      listeners.forEach((listener) => listener(nextState));
    },
    getActiveSubscriptions: () => activeSubscriptions,
    getMaxActiveSubscriptions: () => maxActiveSubscriptions,
    getSubscribeCalls: () => subscribeCalls,
    getUnsubscribeCalls: () => unsubscribeCalls,
  };
}

describe("account runtime state store", () => {
  it("starts in the same local-only state exposed by the runtime boundary", () => {
    const store = createAccountRuntimeStateStore();

    expect(store.getState()).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
    expect(store.getSnapshot()).toEqual(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE);
  });

  it("returns stable reads without activating account or sync state", async () => {
    const store = createAccountRuntimeStateStore();

    const beforeRefresh = store.getSnapshot();
    const repeatedSnapshot = store.getSnapshot();
    const refreshed = await store.refresh();
    const afterRefresh = store.getSnapshot();

    expect(Object.is(beforeRefresh, repeatedSnapshot)).toBe(true);
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

  it("keeps construction side-effect free until the first downstream subscriber attaches", () => {
    const harness = createBoundaryHarness();

    createAccountRuntimeStateStore(harness.boundary);

    expect(harness.getSubscribeCalls()).toBe(0);
    expect(harness.getActiveSubscriptions()).toBe(0);
  });

  it("reuses one upstream boundary subscription across multiple downstream subscribers", () => {
    const harness = createBoundaryHarness();
    const store = createAccountRuntimeStateStore(harness.boundary);
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const firstSubscription = store.subscribe(firstListener);

    expect(harness.getSubscribeCalls()).toBe(1);
    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);

    const secondSubscription = store.subscribe(secondListener);

    expect(harness.getSubscribeCalls()).toBe(1);
    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);

    firstSubscription.unsubscribe();

    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getUnsubscribeCalls()).toBe(0);

    secondSubscription.unsubscribe();

    expect(harness.getActiveSubscriptions()).toBe(0);
    expect(harness.getUnsubscribeCalls()).toBe(1);
  });

  it("leaks nothing across StrictMode-style subscribe and cleanup replay", () => {
    const harness = createBoundaryHarness();
    const store = createAccountRuntimeStateStore(harness.boundary);
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const firstSubscription = store.subscribe(firstListener);
    firstSubscription.unsubscribe();

    expect(harness.getSubscribeCalls()).toBe(1);
    expect(harness.getUnsubscribeCalls()).toBe(1);
    expect(harness.getActiveSubscriptions()).toBe(0);

    const secondSubscription = store.subscribe(secondListener);
    secondSubscription.unsubscribe();

    expect(harness.getSubscribeCalls()).toBe(2);
    expect(harness.getUnsubscribeCalls()).toBe(2);
    expect(harness.getActiveSubscriptions()).toBe(0);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);
  });

  it("keeps the Settings-style two-consumer subscription bounded across StrictMode and rerenders", async () => {
    const harness = createBoundaryHarness();
    const store = createAccountRuntimeStateStore(harness.boundary);
    const renderCounts = { page: 0, card: 0 };
    let rerenderParent: (() => void) | null = null;

    function Consumer({ name }: { name: keyof typeof renderCounts }) {
      useAccountRuntimeState(store);
      renderCounts[name] += 1;
      return null;
    }

    function SettingsRuntimeHarness() {
      const [, setRenderVersion] = useState(0);
      rerenderParent = () => setRenderVersion((version) => version + 1);

      return (
        <>
          <Consumer name="page" />
          <Consumer name="card" />
        </>
      );
    }

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <SettingsRuntimeHarness />
        </StrictMode>
      );
    });

    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);
    expect(harness.getSubscribeCalls()).toBe(2);

    const subscribeCallsAfterStrictModeReplay = harness.getSubscribeCalls();
    const rendersAfterMount = { ...renderCounts };

    await act(async () => {
      rerenderParent?.();
      rerenderParent?.();
    });

    expect(harness.getSubscribeCalls()).toBe(subscribeCallsAfterStrictModeReplay);
    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(renderCounts.page).toBeLessThanOrEqual(rendersAfterMount.page + 2);
    expect(renderCounts.card).toBeLessThanOrEqual(rendersAfterMount.card + 2);

    const equivalentState = {
      ...LOCAL_ONLY_ACCOUNT_RUNTIME_STATE,
      syncCapability: { ...LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.syncCapability },
      syncStatus: { ...LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.syncStatus },
      syncMetadata: { ...LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.syncMetadata },
    };

    await act(async () => {
      harness.emit(equivalentState);
      harness.emit({ ...equivalentState });
      harness.emit({ ...equivalentState });
    });

    expect(harness.getSubscribeCalls()).toBe(subscribeCallsAfterStrictModeReplay);
    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);
    expect(renderCounts.page).toBeLessThanOrEqual(rendersAfterMount.page + 4);
    expect(renderCounts.card).toBeLessThanOrEqual(rendersAfterMount.card + 4);

    await act(async () => {
      root.unmount();
    });

    expect(harness.getActiveSubscriptions()).toBe(0);
    expect(harness.getUnsubscribeCalls()).toBe(2);
  });
});
