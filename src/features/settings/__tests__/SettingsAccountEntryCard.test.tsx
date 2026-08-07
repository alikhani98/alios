import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AccountRuntimeProvider,
  EMAIL_ACCOUNT_PROVIDER_ID,
  GOOGLE_ACCOUNT_PROVIDER_ID,
  LOCAL_ONLY_SYNC_STATUS,
  createAccountRuntimeBoundary,
  createAccountRuntimeStateStore,
  type AccountCapabilitySet,
  type AccountIdentity,
  type AccountProvider,
  type AccountSessionBoundary,
  type AccountStateListener,
  type AccountStateSubscription,
  type AccountStatus,
} from "@/core/account";
import {
  AuthRuntimeProvider,
  type AuthLoginInput,
  type AuthLoginResult,
  type AuthProvider,
  type AuthSession,
  type AuthStateListener,
  type AuthStateSubscription,
  type AuthUser,
} from "@/core/auth";
import type {
  SyncConflictRecord,
  SyncConflictResolutionInput,
  SyncConflictResolutionResult,
  SyncProvider,
  SyncResult,
  SyncStateListener,
  SyncStateSubscription,
  SyncStatus,
} from "@/core/sync";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { SettingsAccountEntryCard } from "../components/SettingsAccountEntryCard";
import { shouldRenderStandaloneAccountFeedback } from "../components/SettingsAccountEntryCard";

class TestAccountProvider implements AccountProvider {
  readonly providerId: string;

  constructor(
    providerId: string,
    private readonly status: AccountStatus,
    private readonly session: AccountSessionBoundary,
    private readonly capabilities: AccountCapabilitySet
  ) {
    this.providerId = providerId;
  }

  async getStatus() {
    return this.status;
  }

  async getCapabilities() {
    return this.capabilities;
  }

  async getCurrentIdentity(): Promise<AccountIdentity | null> {
    return this.session.identity;
  }

  async getCurrentSession() {
    return this.session;
  }

  async authenticate(
    _input: Readonly<Record<string, unknown>>
  ): Promise<{ session: AccountSessionBoundary }> {
    return { session: this.session };
  }

  async restoreIdentity() {
    return this.session;
  }

  async refreshSession() {
    return this.session;
  }

  async signOut(): Promise<void> {
    return undefined;
  }

  subscribe(_listener: AccountStateListener): AccountStateSubscription {
    return { unsubscribe: () => undefined };
  }
}

class TestAuthProvider implements AuthProvider {
  readonly name: string;

  constructor(
    name: string,
    private readonly session: AuthSession,
    private readonly configured = true
  ) {
    this.name = name;
  }

  isConfigured() {
    return this.configured;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.session.user;
  }

  async getCurrentSession(): Promise<AuthSession> {
    return this.session;
  }

  async createAccount(_input: AuthLoginInput): Promise<AuthLoginResult> {
    return { session: this.session };
  }

  async login(_input: AuthLoginInput): Promise<AuthLoginResult> {
    return { session: this.session };
  }

  async logout(): Promise<void> {
    return undefined;
  }

  async refreshSession(): Promise<AuthSession> {
    return this.session;
  }

  subscribe(_listener: AuthStateListener): AuthStateSubscription {
    return { unsubscribe: () => undefined };
  }
}

class TestSyncProvider implements SyncProvider {
  readonly name: string;

  constructor(name: string, private readonly status: SyncStatus) {
    this.name = name;
  }

  async getStatus(): Promise<SyncStatus> {
    return this.status;
  }

  async syncNow(): Promise<SyncResult> {
    return { status: this.status, changedRecords: 0 };
  }

  getConflictSnapshot(): ReadonlyArray<SyncConflictRecord> {
    return [];
  }

  async listConflicts(): Promise<ReadonlyArray<SyncConflictRecord>> {
    return [];
  }

  async resolveConflict(
    _input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult> {
    throw new Error("No conflicts available.");
  }

  subscribe(_listener: SyncStateListener): SyncStateSubscription {
    return { unsubscribe: () => undefined };
  }
}

async function renderEntryCard(
  boundary = createAccountRuntimeBoundary(),
  authProvider: AuthProvider
) {
  const store = createAccountRuntimeStateStore(boundary);
  await store.refresh();

  return renderToStaticMarkup(
    <I18nProvider>
      <AccountRuntimeProvider boundary={boundary} store={store}>
        <AuthRuntimeProvider provider={authProvider}>
          <SettingsAccountEntryCard
            expanded={false}
            onOpenDetails={() => undefined}
          />
        </AuthRuntimeProvider>
      </AccountRuntimeProvider>
    </I18nProvider>
  );
}

describe("SettingsAccountEntryCard", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("shows standalone sync feedback for the signed-in email path", () => {
    expect(
      shouldRenderStandaloneAccountFeedback({
        feedback:
          "AliOS synced preferences, tasks, routines, projects, goals, finance, and Personal Manual records for this device.",
        hasInteractiveEmailProvider: true,
        hasActiveAccount: true,
      })
    ).toBe(true);
  });

  it("keeps email-form feedback inline while the email user is still signed out", () => {
    expect(
      shouldRenderStandaloneAccountFeedback({
        feedback: "Email sign-in did not complete.",
        hasInteractiveEmailProvider: true,
        hasActiveAccount: false,
      })
    ).toBe(false);
  });

  it("shows the Google sign-in entry point for a logged-out account state", async () => {
    const authProvider = new TestAuthProvider(GOOGLE_ACCOUNT_PROVIDER_ID, {
      status: "unauthenticated",
      user: null,
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      detail: "No authenticated user session is active.",
    });
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        GOOGLE_ACCOUNT_PROVIDER_ID,
        "signed-out",
        {
          status: "signed-out",
          providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
          lifecycle: "signed-out",
          identity: null,
          detail:
            "AliOS can show a signed-out Google entry point here while your data stays local.",
        },
        {
          status: "signed-out",
          available: ["account-identity", "explicit-sync-opt-in"],
          detail: "Google account capabilities become available after sign-in.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderEntryCard(boundary, authProvider);

    expect(markup).toContain("Account &amp; Sync");
    expect(markup).toContain("Google sign-in");
    expect(markup).toContain("Sign in with Google");
    expect(markup).toContain("Open account &amp; sync details");
    expect(markup).toContain("Signed out");
  });

  it("keeps the login action visible when the user is logged out", async () => {
    const authProvider = new TestAuthProvider(GOOGLE_ACCOUNT_PROVIDER_ID, {
      status: "unauthenticated",
      user: null,
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      detail: "No authenticated user session is active.",
    });
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        GOOGLE_ACCOUNT_PROVIDER_ID,
        "signed-out",
        {
          status: "signed-out",
          providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
          lifecycle: "signed-out",
          identity: null,
          detail:
            "AliOS can show a signed-out Google entry point here while your data stays local.",
        },
        {
          status: "signed-out",
          available: ["account-identity", "explicit-sync-opt-in"],
          detail: "Google account capabilities become available after sign-in.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderEntryCard(boundary, authProvider);

    expect(markup).not.toContain("Enable sync");
    expect(markup).not.toContain("Sign out");
    expect(markup).toContain("Sign in with Google");
  });

  it("shows connected account information and sign-out actions when logged in", async () => {
    const authProvider = new TestAuthProvider(GOOGLE_ACCOUNT_PROVIDER_ID, {
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-29T00:00:00.000Z",
        updatedAt: "2026-07-29T00:00:00.000Z",
      },
      detail: "Authenticated Google session.",
    });
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        GOOGLE_ACCOUNT_PROVIDER_ID,
        "authenticated",
        {
          status: "authenticated",
          providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
          lifecycle: "signed-in",
          identity: {
            accountId: "account-1",
            email: "user@example.com",
            displayName: "AliOS User",
            providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
            metadata: {},
          },
          detail: "Google account connected on this device.",
          lastAuthenticatedAt: "2026-07-29T00:00:00.000Z",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderEntryCard(boundary, authProvider);

    expect(markup).toContain("AliOS User");
    expect(markup).toContain("user@example.com");
    expect(markup).toContain("Signed in");
    expect(markup).toContain("Enable sync");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("Open account &amp; sync details");
  });

  it("shows the connected email in the signed-in email account state", async () => {
    const authProvider = new TestAuthProvider(EMAIL_ACCOUNT_PROVIDER_ID, {
      status: "authenticated",
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "owner@example.com",
        displayName: "AliOS Owner",
        createdAt: "2026-07-29T00:00:00.000Z",
        updatedAt: "2026-07-29T00:00:00.000Z",
      },
      detail: "Authenticated email session.",
    });
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        EMAIL_ACCOUNT_PROVIDER_ID,
        "authenticated",
        {
          status: "authenticated",
          providerId: EMAIL_ACCOUNT_PROVIDER_ID,
          lifecycle: "signed-in",
          identity: {
            accountId: "account-1",
            email: "owner@example.com",
            displayName: "AliOS Owner",
            providerId: EMAIL_ACCOUNT_PROVIDER_ID,
            metadata: {},
          },
          detail: "Email account connected on this device.",
          lastAuthenticatedAt: "2026-07-29T00:00:00.000Z",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderEntryCard(boundary, authProvider);

    expect(markup).toContain("AliOS Owner");
    expect(markup).toContain("owner@example.com");
    expect(markup).toContain("Sign out");
  });

  it("shows real email account actions when the configured provider is email", async () => {
    const authProvider = new TestAuthProvider(EMAIL_ACCOUNT_PROVIDER_ID, {
      status: "unauthenticated",
      user: null,
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      detail: "No authenticated email session is active.",
    });
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        EMAIL_ACCOUNT_PROVIDER_ID,
        "signed-out",
        {
          status: "signed-out",
          providerId: EMAIL_ACCOUNT_PROVIDER_ID,
          lifecycle: "signed-out",
          identity: null,
          detail:
            "AliOS can show the signed-out email account entry here while your data stays local.",
        },
        {
          status: "signed-out",
          available: ["account-identity", "explicit-sync-opt-in"],
          detail: "Email account capabilities become available after sign-in.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderEntryCard(boundary, authProvider);

    expect(markup).toContain("Email sign-in");
    expect(markup).toContain("Create account");
    expect(markup).toContain("Sign in with email");
    expect(markup).not.toContain("Sign in with Google");
  });
});
