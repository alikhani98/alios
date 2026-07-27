import type { PreferenceSyncCategory } from "@/shared/preferences";

import type { SyncProfileStatus } from "@/core/sync/profileContract";

export type AuthSessionLifecyclePhase =
  | "bootstrapping"
  | "local-only"
  | "authenticated-active"
  | "authenticated-refreshing"
  | "expired"
  | "logged-out"
  | "error";

export type AuthSessionPersistenceClass =
  | "memory-only"
  | "provider-managed"
  | "device-secure-storage";

export type AuthIdentityAvailability =
  | "unavailable"
  | "available-for-local-association"
  | "available-for-sync";

export type AuthSyncReadiness =
  | "disabled"
  | "awaiting-session"
  | "awaiting-explicit-sync-setup"
  | "enabled";

export type AuthLogoutDataHandling =
  | "preserve-local-data"
  | "remove-remote-session"
  | "preserve-device-local-preferences";

export type AuthSecurityBoundary = Readonly<{
  tokensStayOutOfPreferences: true;
  tokensStayOutOfBackupExports: true;
  sessionStateStaysOutsideRepositoryData: true;
  authMetadataMustNotReuseFeatureStorageKeys: true;
}>;

export type AuthSessionLifecycleRuleSet = Readonly<{
  lifecycle: Readonly<{
    initialPhase: "bootstrapping";
    localOnlyPhase: "local-only";
    authenticatedPhase: "authenticated-active";
    refreshPhase: "authenticated-refreshing";
    expirationPhase: "expired";
    logoutPhase: "logged-out";
    errorPhase: "error";
  }>;
  localFirst: Readonly<{
    beforeLoginDataBehavior: "preserve-existing-local-records";
    afterLoginAssociation: "identity-may-associate-with-existing-local-data";
    logoutBehavior: ReadonlyArray<AuthLogoutDataHandling>;
  }>;
  syncHandoff: Readonly<{
    syncDisabledWhen: ReadonlyArray<AuthSyncReadiness>;
    identityAvailabilityBeforeLogin: "unavailable";
    identityAvailabilityAfterAuthentication: "available-for-local-association";
    identityAvailabilityAfterExplicitSyncSetup: "available-for-sync";
    syncRequiresExplicitAccountSetup: true;
    syncRequiresAuthenticatedSession: true;
  }>;
  sessionStorage: Readonly<{
    defaultClass: "provider-managed";
    localOnlyRuntimeClass: "memory-only";
    backupContainsSessionData: false;
    preferencesContainSessionData: false;
  }>;
  security: AuthSecurityBoundary;
}>;

export const SESSION_EXCLUDED_PREFERENCE_CATEGORIES = [
  "account-synced",
  "device-local",
  "intentionally-unsynced",
] as const satisfies ReadonlyArray<PreferenceSyncCategory>;

export const SESSION_SECURITY_BOUNDARY: AuthSecurityBoundary = {
  tokensStayOutOfPreferences: true,
  tokensStayOutOfBackupExports: true,
  sessionStateStaysOutsideRepositoryData: true,
  authMetadataMustNotReuseFeatureStorageKeys: true,
};

export const DEFAULT_AUTH_SESSION_LIFECYCLE_RULE_SET: AuthSessionLifecycleRuleSet =
  {
    lifecycle: {
      initialPhase: "bootstrapping",
      localOnlyPhase: "local-only",
      authenticatedPhase: "authenticated-active",
      refreshPhase: "authenticated-refreshing",
      expirationPhase: "expired",
      logoutPhase: "logged-out",
      errorPhase: "error",
    },
    localFirst: {
      beforeLoginDataBehavior: "preserve-existing-local-records",
      afterLoginAssociation: "identity-may-associate-with-existing-local-data",
      logoutBehavior: [
        "preserve-local-data",
        "remove-remote-session",
        "preserve-device-local-preferences",
      ],
    },
    syncHandoff: {
      syncDisabledWhen: [
        "disabled",
        "awaiting-session",
        "awaiting-explicit-sync-setup",
      ],
      identityAvailabilityBeforeLogin: "unavailable",
      identityAvailabilityAfterAuthentication: "available-for-local-association",
      identityAvailabilityAfterExplicitSyncSetup: "available-for-sync",
      syncRequiresExplicitAccountSetup: true,
      syncRequiresAuthenticatedSession: true,
    },
    sessionStorage: {
      defaultClass: "provider-managed",
      localOnlyRuntimeClass: "memory-only",
      backupContainsSessionData: false,
      preferencesContainSessionData: false,
    },
    security: SESSION_SECURITY_BOUNDARY,
  };

export const AUTH_SYNC_READINESS_BY_PROFILE_STATUS: Readonly<
  Record<SyncProfileStatus, AuthSyncReadiness>
> = {
  "local-only": "disabled",
  provisioning: "awaiting-session",
  ready: "enabled",
  paused: "awaiting-explicit-sync-setup",
  error: "disabled",
};

/**
 * Stage 214C defines future session lifecycle behavior only.
 *
 * The contract intentionally avoids introducing token persistence, route guards,
 * provider activation, network behavior, or any change to current local-first
 * runtime behavior.
 */
