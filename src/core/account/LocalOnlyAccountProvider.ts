import type {
  AccountAuthenticateInput,
  AccountAuthenticateResult,
  AccountCapabilitySet,
  AccountIdentity,
  AccountProvider,
  AccountSessionBoundary,
  AccountStateListener,
  AccountStateSubscription,
  AccountStatus,
} from "./types";
import { LOCAL_ONLY_ACCOUNT_CAPABILITY_SET } from "./types";

export const LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY: AccountSessionBoundary = {
  status: "local-only",
  identity: null,
  providerId: "local-only",
  detail:
    "AliOS remains local-first. No account session is active in the current runtime.",
};

export class LocalOnlyAccountProvider implements AccountProvider {
  readonly providerId = "local-only";

  async getStatus(): Promise<AccountStatus> {
    return "local-only";
  }

  async getCapabilities(): Promise<AccountCapabilitySet> {
    return LOCAL_ONLY_ACCOUNT_CAPABILITY_SET;
  }

  async getCurrentIdentity(): Promise<AccountIdentity | null> {
    return null;
  }

  async getCurrentSession(): Promise<AccountSessionBoundary> {
    return LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY;
  }

  async authenticate(
    _input: AccountAuthenticateInput
  ): Promise<AccountAuthenticateResult> {
    throw new Error("Account authentication is not enabled in AliOS 1.0.");
  }

  async restoreIdentity(): Promise<AccountSessionBoundary> {
    return LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY;
  }

  async refreshSession(): Promise<AccountSessionBoundary> {
    return LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY;
  }

  async signOut(): Promise<void> {
    return undefined;
  }

  subscribe(listener: AccountStateListener): AccountStateSubscription {
    listener(LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY);

    return {
      unsubscribe: () => undefined,
    };
  }
}

export const localOnlyAccountProvider = new LocalOnlyAccountProvider();
