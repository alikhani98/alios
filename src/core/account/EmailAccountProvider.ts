import { EMAIL_ACCOUNT_PROVIDER_ID } from "./types";
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
import { emailAuthRuntime, type EmailAuthRuntime } from "@/core/auth/emailAuthRuntime";

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
      "Email account access is active on this device. Sync remains under explicit local-first control.",
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

export class EmailAccountProvider implements AccountProvider {
  readonly providerId = EMAIL_ACCOUNT_PROVIDER_ID;

  constructor(private readonly runtime: EmailAuthRuntime = emailAuthRuntime) {}

  private async getDerivedSession(): Promise<AccountSessionBoundary> {
    if (!this.runtime.isConfigured()) {
      return {
        status: "provider-unavailable",
        providerId: EMAIL_ACCOUNT_PROVIDER_ID,
        lifecycle: "signed-out",
        identity: null,
        detail:
          "Email sign-in is unavailable until Supabase environment variables are configured.",
      };
    }

    const authSession = await this.runtime.getSession();

    if (authSession.status === "authenticated" && authSession.user) {
      return {
        status: "authenticated",
        providerId: EMAIL_ACCOUNT_PROVIDER_ID,
        lifecycle: "signed-in",
        identity: {
          accountId: authSession.user.userId,
          email: authSession.user.email,
          displayName: authSession.user.displayName,
          providerId: EMAIL_ACCOUNT_PROVIDER_ID,
          createdAt: authSession.user.createdAt,
          updatedAt: authSession.user.updatedAt,
          metadata: authSession.user.metadata,
        },
        expiresAt: authSession.expiresAt,
        lastAuthenticatedAt: authSession.user.updatedAt,
        detail: authSession.detail,
      };
    }

    if (authSession.status === "error") {
      return {
        status: "expired",
        providerId: EMAIL_ACCOUNT_PROVIDER_ID,
        lifecycle: "expired",
        identity: null,
        detail: authSession.detail,
      };
    }

    return {
      status: "signed-out",
      providerId: EMAIL_ACCOUNT_PROVIDER_ID,
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
        "Email sign-in is unavailable until Supabase environment variables are configured."
      );
    }

    const session = await this.getDerivedSession();

    if (session.status === "authenticated") {
      return buildAuthenticatedCapabilitySet();
    }

    if (session.status === "expired") {
      return buildSignedOutCapabilitySet(
        session.detail ??
          "The previous email session expired. Sign in again to reconnect this device."
      );
    }

    return buildSignedOutCapabilitySet(
      session.detail ?? "No email account is signed in on this device."
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
      email: input.email,
      password: input.password,
      metadata: input.metadata,
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

export const emailAccountProvider = new EmailAccountProvider();
