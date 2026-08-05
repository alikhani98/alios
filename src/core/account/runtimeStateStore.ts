import { useSyncExternalStore } from "react";

import {
  LOCAL_ONLY_ACCOUNT_RUNTIME_STATE,
  localOnlyAccountRuntimeBoundary,
  type AccountRuntimeBoundary,
  type AccountRuntimeState,
} from "./runtimeBoundary";
import type {
  AccountRuntimeStateListener,
  AccountStateSubscription,
} from "./types";

export interface AccountRuntimeStateStore {
  getState(): AccountRuntimeState;
  getSnapshot(): AccountRuntimeState;
  refresh(): Promise<AccountRuntimeState>;
  subscribe(
    listener: AccountRuntimeStateListener<AccountRuntimeState>
  ): AccountStateSubscription;
}

class DefaultAccountRuntimeStateStore implements AccountRuntimeStateStore {
  private state: AccountRuntimeState = LOCAL_ONLY_ACCOUNT_RUNTIME_STATE;
  private readonly listeners = new Set<
    AccountRuntimeStateListener<AccountRuntimeState>
  >();
  private boundarySubscription: AccountStateSubscription | null = null;

  constructor(private readonly boundary: AccountRuntimeBoundary) {
    // Intentionally side-effect free. Upstream boundary observation starts only
    // when the first downstream subscriber attaches.
  }

  getState(): AccountRuntimeState {
    return this.state;
  }

  getSnapshot(): AccountRuntimeState {
    return this.state;
  }

  async refresh(): Promise<AccountRuntimeState> {
    const nextState = await this.boundary.getState();
    this.setState(nextState);
    return nextState;
  }

  subscribe(
    listener: AccountRuntimeStateListener<AccountRuntimeState>
  ): AccountStateSubscription {
    this.ensureBoundarySubscription();
    this.listeners.add(listener);
    listener(this.state);

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
          this.boundarySubscription?.unsubscribe();
          this.boundarySubscription = null;
        }
      },
    };
  }

  private ensureBoundarySubscription() {
    if (this.boundarySubscription) {
      return;
    }

    this.boundarySubscription = this.boundary.subscribe((nextState) => {
      this.setState(nextState);
    });
  }

  private setState(nextState: AccountRuntimeState) {
    if (Object.is(this.state, nextState)) {
      return;
    }

    this.state = nextState;
    this.listeners.forEach((listener) => {
      listener(this.state);
    });
  }
}

export function createAccountRuntimeStateStore(
  boundary: AccountRuntimeBoundary = localOnlyAccountRuntimeBoundary
): AccountRuntimeStateStore {
  return new DefaultAccountRuntimeStateStore(boundary);
}

export const accountRuntimeStateStore = createAccountRuntimeStateStore();

export function useAccountRuntimeState(
  store: AccountRuntimeStateStore = accountRuntimeStateStore
): AccountRuntimeState {
  return useSyncExternalStore(
    (listener) => store.subscribe(listener).unsubscribe,
    () => store.getSnapshot(),
    () => store.getSnapshot()
  );
}

export const selectAccountRuntimeStatus = (state: AccountRuntimeState) =>
  state.accountStatus;

export const selectAuthSessionStatus = (state: AccountRuntimeState) =>
  state.authStatus;

export const selectSyncCapabilityStatus = (state: AccountRuntimeState) =>
  state.syncCapability;

export const selectSyncStatus = (state: AccountRuntimeState) =>
  state.syncStatus;
