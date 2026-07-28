export const LOCAL_ONLY_ACCOUNT_PROVIDER_ID = "local-only" as const;
export const GOOGLE_ACCOUNT_PROVIDER_ID = "google" as const;

export type AccountProviderId =
  | typeof LOCAL_ONLY_ACCOUNT_PROVIDER_ID
  | typeof GOOGLE_ACCOUNT_PROVIDER_ID
  | (string & {});

export type GoogleAccountIdentityMetadata = Readonly<{
  googleSubject?: string;
  avatarUrl?: string;
}>;

export type AccountIdentity = Readonly<{
  accountId: string;
  email?: string;
  displayName?: string;
  providerId: AccountProviderId;
  createdAt?: string;
  updatedAt?: string;
  metadata?: GoogleAccountIdentityMetadata | Readonly<Record<string, unknown>>;
}>;

export type AccountStatus =
  | "local-only"
  | "signed-out"
  | "authenticating"
  | "authenticated"
  | "expired"
  | "provider-unavailable"
  | "error";

export type AccountCapabilityName =
  | "account-identity"
  | "session-refresh"
  | "sign-out"
  | "explicit-sync-opt-in";

export type AccountCapabilitySet = Readonly<{
  status: AccountStatus;
  available: ReadonlyArray<AccountCapabilityName>;
  detail: string;
}>;

export type AccountSessionBoundary = Readonly<{
  status: AccountStatus;
  identity: AccountIdentity | null;
  providerId: AccountProviderId;
  lifecycle: SessionLifecycleState;
  expiresAt?: string;
  lastAuthenticatedAt?: string;
  detail?: string;
}>;

export type SessionLifecycleState =
  | "local-only"
  | "signed-out"
  | "signed-in"
  | "expired";

export type AccountAuthenticateInput = Readonly<{
  email?: string;
  password?: string;
  redirectTo?: string;
  providerHint?: AccountProviderId;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type AccountAuthenticateResult = Readonly<{
  session: AccountSessionBoundary;
  requiresVerification?: boolean;
}>;

export type AccountStateListener = (
  session: AccountSessionBoundary
) => void;

export type AccountRuntimeStateListener<TState> = (
  state: TState
) => void;

export type AccountStateSubscription = Readonly<{
  unsubscribe: () => void;
}>;

/**
 * Contract-only boundary for future account providers.
 *
 * The provider owns identity and session restoration only. It must not own
 * application records, repository logic, feature workflows, or local-storage
 * migration behavior.
 */
export interface AccountProvider {
  readonly providerId: string;
  getStatus(): Promise<AccountStatus>;
  getCapabilities(): Promise<AccountCapabilitySet>;
  getCurrentIdentity(): Promise<AccountIdentity | null>;
  getCurrentSession(): Promise<AccountSessionBoundary>;
  authenticate(
    input: AccountAuthenticateInput
  ): Promise<AccountAuthenticateResult>;
  restoreIdentity(): Promise<AccountSessionBoundary>;
  refreshSession(): Promise<AccountSessionBoundary>;
  signOut(): Promise<void>;
  subscribe(listener: AccountStateListener): AccountStateSubscription;
}

export const LOCAL_ONLY_ACCOUNT_CAPABILITIES: ReadonlyArray<AccountCapabilityName> =
  [];

export const LOCAL_ONLY_ACCOUNT_CAPABILITY_SET: AccountCapabilitySet = {
  status: "local-only",
  available: LOCAL_ONLY_ACCOUNT_CAPABILITIES,
  detail:
    "AliOS remains fully local-first. No account capability is active until a future optional provider is explicitly enabled.",
};
