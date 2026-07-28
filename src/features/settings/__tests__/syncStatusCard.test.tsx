import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountRuntimeProvider,
  LOCAL_ONLY_SYNC_STATUS,
  createAccountRuntimeStateStore,
  createAccountRuntimeBoundary,
  type AccountCapabilitySet,
  type AccountIdentity,
  type AccountProvider,
  type AccountSessionBoundary,
  type AccountStateListener,
  type AccountStateSubscription,
  type AccountStatus,
} from "@/core/account";
import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "@/core/auth";
import type { SyncProvider, SyncResult, SyncStatus } from "@/core/sync";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { SyncStatusCard } from "../components/SyncStatusCard";

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

  constructor(name: string, private readonly session: AuthSession) {
    this.name = name;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.session.user;
  }

  async getCurrentSession(): Promise<AuthSession> {
    return this.session;
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
}

async function renderCardToStaticMarkup(boundary = createAccountRuntimeBoundary()) {
  const store = createAccountRuntimeStateStore(boundary);
  await store.refresh();

  return renderToStaticMarkup(
    <I18nProvider>
      <AccountRuntimeProvider boundary={boundary} store={store}>
        <SyncStatusCard onGoToBackupRestore={vi.fn()} />
      </AccountRuntimeProvider>
    </I18nProvider>
  );
}

describe("SyncStatusCard", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders the polished account and sync foundation with grouped states, disabled actions, and accessibility labels", async () => {
    const markup = await renderCardToStaticMarkup();

    expect(markup).toContain("Account &amp; Sync");
    expect(markup).toContain("aria-label=\"Account and sync snapshot\"");
    expect(markup).toContain("Local only");
    expect(markup).toContain("Future sync states");
    expect(markup).toContain("Sync available");
    expect(markup).toContain("Sync paused");
    expect(markup).toContain("Offline");
    expect(markup).toContain("Conflict detected");
    expect(markup).toContain("Planned only");
    expect(markup).toContain("Create account");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Enable sync");
    expect(markup).toContain("disabled=\"\"");
    expect(markup).toContain("aria-describedby=\"account-sync-future-actions-description\"");
    expect(markup).toContain("aria-label=\"Future account actions\"");
    expect(markup).toContain("Expand section");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("Data stays on this device");
  });

  it("renders the future signed-out representation without showing a fake session", async () => {
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        "future-account",
        "signed-out",
        {
          status: "signed-out",
          providerId: "future-account",
          identity: null,
          detail:
            "AliOS can prepare an account entry point here later, but no authenticated session is active.",
        },
        {
          status: "signed-out",
          available: ["account-identity", "explicit-sync-opt-in"],
          detail: "Future account capabilities are available after sign-in.",
        }
      ),
      authProvider: new TestAuthProvider("future-auth", {
        status: "unauthenticated",
        user: null,
        provider: "future-auth",
        detail: "No authenticated user session is active.",
      }),
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderCardToStaticMarkup(boundary);

    expect(markup).toContain("Signed out");
    expect(markup).toContain("Future sign-in actions");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Enable sync · Requires sign-in");
  });

  it("renders a future signed-in placeholder state with account details and sign-out preparation", async () => {
    const boundary = createAccountRuntimeBoundary({
      accountProvider: new TestAccountProvider(
        "future-account",
        "authenticated",
        {
          status: "authenticated",
          providerId: "future-account",
          identity: {
            accountId: "account-1",
            email: "user@example.com",
            displayName: "AliOS User",
            providerId: "future-account",
          },
          detail: "A future signed-in account may appear here once authentication is approved.",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider: new TestAuthProvider("future-auth", {
        status: "authenticated",
        provider: "future-auth",
        user: {
          userId: "user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T00:00:00.000Z",
        },
        detail: "Authenticated placeholder session.",
      }),
      syncProvider: new TestSyncProvider("local-only", LOCAL_ONLY_SYNC_STATUS),
    });

    const markup = await renderCardToStaticMarkup(boundary);

    expect(markup).toContain("Signed in");
    expect(markup).toContain("AliOS User");
    expect(markup).toContain("user@example.com");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("Manage account");
  });

  it("renders the Persian account and sync copy for the settings surface", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = await renderCardToStaticMarkup();

    expect(markup).toContain("حساب و همگام‌سازی");
    expect(markup).toContain("فقط محلی");
    expect(markup).toContain("خلاصهٔ حساب و همگام‌سازی");
    expect(markup).toContain("وضعیت‌های آیندهٔ همگام‌سازی");
    expect(markup).toContain("تعارض شناسایی شد");
    expect(markup).toContain("ایجاد حساب");
    expect(markup).toContain("فعال‌کردن همگام‌سازی");
  });
});
