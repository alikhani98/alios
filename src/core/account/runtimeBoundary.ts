import {
  LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY,
  localOnlyAccountProvider,
} from "./LocalOnlyAccountProvider";
import type {
  AuthProvider,
  AuthSession,
  AuthSessionSource,
  AuthSessionStatus,
} from "@/core/auth";
import { localOnlyAuthProvider } from "@/core/auth";
import {
  localOnlySyncProvider,
  type SyncConflictRecord,
  type SyncConflictResolutionInput,
  type SyncConflictResolutionResult,
  type SyncProvider,
} from "@/core/sync";
import { LOCAL_ONLY_SYNC_METADATA, type SyncMetadataSnapshot } from "@/core/sync";
import type { SyncStatus } from "@/core/sync/types";
import {
  LOCAL_ONLY_ACCOUNT_CAPABILITY_SET,
  LOCAL_ONLY_ACCOUNT_PROVIDER_ID,
  type AccountProvider,
  type AccountCapabilitySet,
  type AccountIdentity,
  type AccountRuntimeStateListener,
  type AccountSessionBoundary,
  type SessionLifecycleState,
  type AccountStateSubscription,
  type AccountStatus,
} from "./types";

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
  accountProviderId: string;
  accountStatus: AccountStatus;
  authStatus: AuthSessionStatus;
  sessionLifecycle: SessionLifecycleState;
  localOnly: boolean;
  hasActiveAccount: boolean;
  identity: AccountIdentity | null;
  accountCapabilities: AccountCapabilitySet;
  session: AccountSessionBoundary;
  authSession: AuthSession;
  syncCapability: SyncCapability;
  syncStatus: SyncStatus;
  syncMetadata: SyncMetadataSnapshot;
  detail: string;
}>;

export interface AccountRuntimeBoundary {
  getState(): Promise<AccountRuntimeState>;
  syncNow(): Promise<SyncStatus>;
  getSyncConflictSnapshot(): ReadonlyArray<SyncConflictRecord>;
  getSyncConflicts(): Promise<ReadonlyArray<SyncConflictRecord>>;
  resolveSyncConflict(
    input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult | null>;
  subscribe(
    listener: AccountRuntimeStateListener<AccountRuntimeState>
  ): AccountStateSubscription;
}

export const LOCAL_ONLY_SYNC_CAPABILITY: SyncCapability = {
  availability: "local-only",
  enabled: false,
  detail:
    "AliOS keeps sync disabled by default. No account connection or remote transfer is active.",
};

export const LOCAL_ONLY_AUTH_SESSION: AuthSession = {
  status: "unauthenticated",
  user: null,
  provider: LOCAL_ONLY_ACCOUNT_PROVIDER_ID,
  detail: "AliOS is currently running without an authenticated user session.",
};

export const LOCAL_ONLY_SYNC_STATUS: SyncStatus = {
  mode: "local-only",
  provider: LOCAL_ONLY_ACCOUNT_PROVIDER_ID,
  detail: "AliOS is currently running only on this device.",
};

export const LOCAL_ONLY_ACCOUNT_RUNTIME_STATE: AccountRuntimeState = {
  accountProviderId: LOCAL_ONLY_ACCOUNT_PROVIDER_ID,
  accountStatus: "local-only",
  authStatus: "unauthenticated",
  sessionLifecycle: "local-only",
  localOnly: true,
  hasActiveAccount: false,
  identity: null,
  accountCapabilities: LOCAL_ONLY_ACCOUNT_CAPABILITY_SET,
  session: LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY,
  authSession: LOCAL_ONLY_AUTH_SESSION,
  syncCapability: LOCAL_ONLY_SYNC_CAPABILITY,
  syncStatus: LOCAL_ONLY_SYNC_STATUS,
  syncMetadata: LOCAL_ONLY_SYNC_METADATA,
  detail:
    "AliOS preserves local-only behavior until a future approved account and sync implementation is explicitly enabled.",
};

type AccountRuntimeBoundaryDependencies = Readonly<{
  accountProvider?: AccountProvider;
  authProvider?: AuthProvider;
  authSessionSource?: AuthSessionSource;
  syncProvider?: SyncProvider;
}>;

function deriveSyncCapability(status: SyncStatus): SyncCapability {
  if (status.mode === "local-only") {
    return LOCAL_ONLY_SYNC_CAPABILITY;
  }

  if (status.mode === "syncing") {
    return {
      availability: "available",
      enabled: true,
      detail: status.detail,
    };
  }

  if (status.mode === "error") {
    if (status.issue === "connectivity") {
      return {
        availability: "offline",
        enabled: false,
        detail: status.detail,
      };
    }

    return {
      availability: status.issue === "conflict" ? "conflict" : "disabled",
      enabled: false,
      detail: status.detail,
    };
  }

  return {
    availability: "available",
    enabled: true,
    detail: status.detail,
  };
}

function deriveSessionLifecycle(
  accountStatus: AccountStatus,
  session: AccountSessionBoundary,
  authSession: AuthSession,
  syncStatus: SyncStatus
): SessionLifecycleState {
  if (
    accountStatus === "local-only" &&
    authSession.status === "unauthenticated" &&
    syncStatus.mode === "local-only"
  ) {
    return "local-only";
  }

  if (
    accountStatus === "expired" ||
    session.status === "expired" ||
    authSession.status === "error"
  ) {
    return "expired";
  }

  if (
    accountStatus === "authenticated" &&
    session.identity &&
    authSession.status === "authenticated"
  ) {
    return "signed-in";
  }

  return "signed-out";
}

function deriveSyncMetadata(status: SyncStatus): SyncMetadataSnapshot {
  if (status.mode === "local-only") {
    return LOCAL_ONLY_SYNC_METADATA;
  }

  return {
    device: {
      deviceId: status.deviceId ?? "current-device",
      label: status.deviceLabel ?? "Current browser",
      platform: "web",
      trust: "known-device",
    },
    state:
      status.mode === "ready"
        ? "available"
        : status.mode === "syncing"
          ? "available"
          : "error",
    lastSyncedAt: status.lastSyncedAt,
    lastAttemptAt: status.lastAttemptAt,
    lastOutcome: status.mode === "error" ? "error" : status.lastSyncedAt ? "success" : "never",
  };
}

function deriveAccountProviderId(
  session: AccountSessionBoundary,
  authSession: AuthSession
): string {
  if (session.providerId !== LOCAL_ONLY_ACCOUNT_PROVIDER_ID) {
    return session.providerId;
  }

  if (authSession.provider !== LOCAL_ONLY_ACCOUNT_PROVIDER_ID) {
    return authSession.provider;
  }

  return LOCAL_ONLY_ACCOUNT_PROVIDER_ID;
}

async function buildAccountRuntimeState(
  accountProvider: AccountProvider,
  authSessionSource: AuthSessionSource,
  syncProvider: SyncProvider
): Promise<AccountRuntimeState> {
  const [accountStatus, accountCapabilities, session, authSession, syncStatus] =
    await Promise.all([
      accountProvider.getStatus(),
      accountProvider.getCapabilities(),
      accountProvider.getCurrentSession(),
      authSessionSource.getCurrentSession(),
      syncProvider.getStatus(),
    ]);

  const identity = session.identity;
  const sessionLifecycle = deriveSessionLifecycle(
    accountStatus,
    session,
    authSession,
    syncStatus
  );
  const localOnly =
    sessionLifecycle === "local-only";
  const accountProviderId = deriveAccountProviderId(session, authSession);

  return {
    accountProviderId,
    accountStatus,
    authStatus: authSession.status,
    sessionLifecycle,
    localOnly,
    hasActiveAccount: identity !== null && accountStatus === "authenticated",
    identity,
    accountCapabilities,
    session,
    authSession,
    syncCapability: deriveSyncCapability(syncStatus),
    syncStatus,
    syncMetadata: deriveSyncMetadata(syncStatus),
    detail: localOnly
      ? LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.detail
      : syncStatus.mode !== "local-only"
        ? syncStatus.detail ??
          session.detail ??
          authSession.detail ??
          "AliOS prepared the account runtime state."
        : session.detail ??
          authSession.detail ??
          syncStatus.detail ??
        "AliOS prepared the account runtime state.",
  };
}

export class DefaultAccountRuntimeBoundary implements AccountRuntimeBoundary {
  constructor(
    private readonly accountProvider: AccountProvider = localOnlyAccountProvider,
    authProvider: AuthProvider = localOnlyAuthProvider,
    private readonly authSessionSource: AuthSessionSource = authProvider,
    private readonly syncProvider: SyncProvider = localOnlySyncProvider
  ) {}

  async getState(): Promise<AccountRuntimeState> {
    return buildAccountRuntimeState(
      this.accountProvider,
      this.authSessionSource,
      this.syncProvider
    );
  }

  async syncNow(): Promise<SyncStatus> {
    const result = await this.syncProvider.syncNow();
    return result.status;
  }

  getSyncConflictSnapshot(): ReadonlyArray<SyncConflictRecord> {
    if (typeof this.syncProvider.getConflictSnapshot !== "function") {
      return [];
    }

    return this.syncProvider.getConflictSnapshot();
  }

  async getSyncConflicts(): Promise<ReadonlyArray<SyncConflictRecord>> {
    if (typeof this.syncProvider.listConflicts !== "function") {
      return [];
    }

    return this.syncProvider.listConflicts();
  }

  async resolveSyncConflict(
    input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult | null> {
    if (typeof this.syncProvider.resolveConflict !== "function") {
      return null;
    }

    return this.syncProvider.resolveConflict(input);
  }

  subscribe(
    listener: AccountRuntimeStateListener<AccountRuntimeState>
  ): AccountStateSubscription {
    let active = true;
    let emitInFlight = false;
    let emitPending = false;

    const emit = () => {
      if (emitInFlight) {
        emitPending = true;
        return;
      }

      emitInFlight = true;
      void this.getState()
        .then((state) => {
          if (active) {
            listener(state);
          }
        })
        .finally(() => {
          emitInFlight = false;
          if (active && emitPending) {
            emitPending = false;
            emit();
          }
        });
    };

    emit();

    const authSubscription = this.authSessionSource.subscribe(() => {
      emit();
    });
    const syncSubscription = this.syncProvider.subscribe(() => {
      emit();
    });

    return {
      unsubscribe: () => {
        active = false;
        authSubscription.unsubscribe();
        syncSubscription.unsubscribe();
      },
    };
  }
}

export function createAccountRuntimeBoundary(
  dependencies: AccountRuntimeBoundaryDependencies = {}
): AccountRuntimeBoundary {
  return new DefaultAccountRuntimeBoundary(
    dependencies.accountProvider ?? localOnlyAccountProvider,
    dependencies.authProvider ?? localOnlyAuthProvider,
    dependencies.authSessionSource ?? dependencies.authProvider ?? localOnlyAuthProvider,
    dependencies.syncProvider ?? localOnlySyncProvider
  );
}

export const localOnlyAccountRuntimeBoundary = createAccountRuntimeBoundary();
