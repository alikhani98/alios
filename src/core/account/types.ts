export type AccountIdentity = Readonly<{
  accountId: string;
  email?: string;
  displayName?: string;
  providerId: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Readonly<Record<string, unknown>>;
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
  providerId: string;
  expiresAt?: string;
  detail?: string;
}>;

export type AccountAuthenticateInput = Readonly<{
  email?: string;
  password?: string;
  redirectTo?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type AccountAuthenticateResult = Readonly<{
  session: AccountSessionBoundary;
  requiresVerification?: boolean;
}>;

export type AccountStateListener = (
  session: AccountSessionBoundary
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
