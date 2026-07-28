import {
  LOCAL_ONLY_ACCOUNT_CAPABILITY_SET,
  type AccountCapabilitySet,
  type AccountIdentity,
  type AccountSessionBoundary,
  type AccountStateListener,
  type AccountStateSubscription,
  type AccountStatus,
} from "./types";
import type { AuthSession, AuthSessionStatus } from "@/core/auth/types";
import type { SyncStatus } from "@/core/sync/types";

export type SyncCapabilityAvailability =
  | "local-only"
  | "available"
  | "paused"
  | "offline"
  | "conflict"
  | "disabled";

export type SyncCapability = Readonly<{
  availability: SyncCapabilityAvailability;
  enabled: boolean;
  detail: string;
}>;

export type AccountRuntimeState = Readonly<{
  accountStatus: AccountStatus;
  authStatus: AuthSessionStatus;
  localOnly: boolean;
  hasActiveAccount: boolean;
  identity: AccountIdentity | null;
  accountCapabilities: AccountCapabilitySet;
  session: AccountSessionBoundary;
  authSession: AuthSession;
  syncCapability: SyncCapability;
  syncStatus: SyncStatus;
  detail: string;
}>;

export interface AccountRuntimeBoundary {
  getState(): Promise<AccountRuntimeState>;
  subscribe(listener: AccountStateListener): AccountStateSubscription;
}

export const LOCAL_ONLY_SYNC_CAPABILITY: SyncCapability = {
  availability: "local-only",
  enabled: false,
  detail:
    "AliOS keeps sync disabled by default. No account connection or remote transfer is active.",
};

export const LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY: AccountSessionBoundary = {
  status: "local-only",
  identity: null,
  providerId: "local-only",
  detail:
    "AliOS remains local-first. No account session is active in the current runtime.",
};

export const LOCAL_ONLY_AUTH_SESSION: AuthSession = {
  status: "unauthenticated",
  user: null,
  provider: "local-only",
  detail: "AliOS is currently running without an authenticated user session.",
};

export const LOCAL_ONLY_SYNC_STATUS: SyncStatus = {
  mode: "local-only",
  provider: "local-only",
  detail: "AliOS is currently running only on this device.",
};

export const LOCAL_ONLY_ACCOUNT_RUNTIME_STATE: AccountRuntimeState = {
  accountStatus: "local-only",
  authStatus: "unauthenticated",
  localOnly: true,
  hasActiveAccount: false,
  identity: null,
  accountCapabilities: LOCAL_ONLY_ACCOUNT_CAPABILITY_SET,
  session: LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY,
  authSession: LOCAL_ONLY_AUTH_SESSION,
  syncCapability: LOCAL_ONLY_SYNC_CAPABILITY,
  syncStatus: LOCAL_ONLY_SYNC_STATUS,
  detail:
    "AliOS preserves local-only behavior until a future approved account and sync implementation is explicitly enabled.",
};

export class LocalOnlyAccountRuntimeBoundary implements AccountRuntimeBoundary {
  async getState(): Promise<AccountRuntimeState> {
    return LOCAL_ONLY_ACCOUNT_RUNTIME_STATE;
  }

  subscribe(listener: AccountStateListener): AccountStateSubscription {
    listener(LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY);

    return {
      unsubscribe: () => undefined,
    };
  }
}

export const localOnlyAccountRuntimeBoundary =
  new LocalOnlyAccountRuntimeBoundary();
