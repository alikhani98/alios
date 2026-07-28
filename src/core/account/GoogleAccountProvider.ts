import { GOOGLE_ACCOUNT_PROVIDER_ID } from "./types";
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
import { googleAuthRuntime, type GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";

function buildSignedOutCapabilitySet(detail: string): AccountCapabilitySet {
  return {
    status: "signed-out",
    available: ["account-identity", "explicit-sync-opt-in"],
    detail,
  };
}

function buildAuthenticatedCapabilitySet(): AccountCapabilitySet {
  return {
    status: "authenticated",
    available: [
      "account-identity",
      "session-refresh",
      "sign-out",
      "explicit-sync-opt-in",
    ],
    detail:
      "Google account access is active on this device. Sync remains off until a future explicit opt-in stage is approved.",
  };
}

function buildUnavailableCapabilitySet(detail: string): AccountCapabilitySet {
  return {
    status: "provider-unavailable",
    available: [],
    detail,
  };
}

function toIdentity(session: AccountSessionBoundary): AccountIdentity | null {
  return session.identity;
}

export class GoogleAccountProvider implements AccountProvider {
  readonly providerId = GOOGLE_ACCOUNT_PROVIDER_ID;

  constructor(private readonly runtime: GoogleAuthRuntime = googleAuthRuntime) {}

  private async getDerivedSession(): Promise<AccountSessionBoundary> {
    if (!this.runtime.isConfigured()) {
      return {
        status: "provider-unavailable",
        providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
        lifecycle: "signed-out",
        identity: null,
        detail:
          "Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured.",
      };
    }

    const authSession = await this.runtime.getSession();

    if (authSession.status === "authenticated" && authSession.user) {
      return {
        status: "authenticated",
        providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
        lifecycle: "signed-in",
        identity: {
          accountId: authSession.user.userId,
          email: authSession.user.email,
          displayName: authSession.user.displayName,
          providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
          createdAt: authSession.user.createdAt,
          updatedAt: authSession.user.updatedAt,
          metadata: {
            googleSubject: authSession.user.userId,
            avatarUrl: authSession.user.avatarUrl,
          },
        },
        expiresAt: authSession.expiresAt,
        lastAuthenticatedAt: authSession.user.updatedAt,
        detail: authSession.detail,
      };
    }

    if (authSession.status === "error") {
      return {
        status: "expired",
        providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
        lifecycle: "expired",
        identity: null,
        detail: authSession.detail,
      };
    }

    return {
      status: "signed-out",
      providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
      lifecycle: "signed-out",
      identity: null,
      detail: authSession.detail,
    };
  }

  async getStatus(): Promise<AccountStatus> {
    return (await this.getDerivedSession()).status;
  }

  async getCapabilities(): Promise<AccountCapabilitySet> {
    if (!this.runtime.isConfigured()) {
      return buildUnavailableCapabilitySet(
        "Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured."
      );
    }

    const session = await this.getDerivedSession();

    if (session.status === "authenticated") {
      return buildAuthenticatedCapabilitySet();
    }

    if (session.status === "expired") {
      return buildSignedOutCapabilitySet(
        session.detail ??
          "The previous Google session expired. Sign in again to reconnect this device."
      );
    }

    return buildSignedOutCapabilitySet(
      session.detail ?? "No Google account is signed in on this device."
    );
  }

  async getCurrentIdentity(): Promise<AccountIdentity | null> {
    return toIdentity(await this.getDerivedSession());
  }

  async getCurrentSession(): Promise<AccountSessionBoundary> {
    return this.getDerivedSession();
  }

  async authenticate(
    input: AccountAuthenticateInput
  ): Promise<AccountAuthenticateResult> {
    const result = await this.runtime.login({
      metadata: input.metadata,
      redirectTo: input.redirectTo,
    });

    return {
      session: await this.getDerivedSession(),
      requiresVerification: result.requiresVerification,
    };
  }

  async restoreIdentity(): Promise<AccountSessionBoundary> {
    return this.getDerivedSession();
  }

  async refreshSession(): Promise<AccountSessionBoundary> {
    await this.runtime.refreshSession();
    return this.getDerivedSession();
  }

  async signOut(): Promise<void> {
    await this.runtime.logout();
  }

  subscribe(listener: AccountStateListener): AccountStateSubscription {
    return this.runtime.subscribe(() => {
      void this.getDerivedSession().then((session) => {
        listener(session);
      });
    });
  }
}

export const googleAccountProvider = new GoogleAccountProvider();
