import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountRuntimeProvider,
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
  localOnlyAuthProvider,
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
import { messagesFa } from "@/shared/i18n/messages.fa";

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
  private readonly conflicts: SyncConflictRecord[];
  private readonly resolveConflictHandler?: (
    input: SyncConflictResolutionInput
  ) => Promise<SyncConflictResolutionResult> | SyncConflictResolutionResult;

  constructor(
    name: string,
    private readonly status: SyncStatus,
    options: Readonly<{
      conflicts?: ReadonlyArray<SyncConflictRecord>;
      resolveConflict?: (
        input: SyncConflictResolutionInput
      ) => Promise<SyncConflictResolutionResult> | SyncConflictResolutionResult;
    }> = {}
  ) {
    this.name = name;
    this.conflicts = [...(options.conflicts ?? [])];
    this.resolveConflictHandler = options.resolveConflict;
  }

  async getStatus(): Promise<SyncStatus> {
    return this.status;
  }

  async syncNow(): Promise<SyncResult> {
    return { status: this.status, changedRecords: 0 };
  }

  getConflictSnapshot(): ReadonlyArray<SyncConflictRecord> {
    return this.conflicts;
  }

  async listConflicts(): Promise<ReadonlyArray<SyncConflictRecord>> {
    return this.conflicts;
  }

  async resolveConflict(
    input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult> {
    if (this.resolveConflictHandler) {
      return this.resolveConflictHandler(input);
    }

    const conflict =
      this.conflicts.find(
        (entry) =>
          entry.entity === input.entity && entry.recordId === input.recordId
      ) ?? this.conflicts[0];

    if (!conflict) {
      throw new Error("No conflict is available for resolution.");
    }

    return {
      status: this.status,
      conflict,
      resolution: input.resolution,
    };
  }

  subscribe(_listener: SyncStateListener): SyncStateSubscription {
    return { unsubscribe: () => undefined };
  }
}

async function renderCardToStaticMarkup(
  boundary = createAccountRuntimeBoundary(),
  authProvider: AuthProvider = localOnlyAuthProvider
) {
  const store = createAccountRuntimeStateStore(boundary);
  await store.refresh();

  return renderToStaticMarkup(
    <I18nProvider>
      <AccountRuntimeProvider boundary={boundary} store={store}>
        <AuthRuntimeProvider provider={authProvider}>
          <SyncStatusCard onGoToBackupRestore={vi.fn()} />
        </AuthRuntimeProvider>
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
    expect(markup).toContain('aria-label="Account and sync snapshot"');
    expect(markup).toContain("Local only");
    expect(markup).toContain("Sync health");
    expect(markup).toContain("Other sync states");
    expect(markup).toContain("Sync available");
    expect(markup).toContain("Sync paused");
    expect(markup).toContain("Offline");
    expect(markup).toContain("Conflict detected");
    expect(markup).toContain("Coming later");
    expect(markup).toContain("Create account");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Enable sync");
    expect(markup).toContain('disabled=""');
    expect(markup).toContain(
      'aria-describedby="account-sync-future-actions-description"'
    );
    expect(markup).toContain('aria-label="Account actions coming later"');
    expect(markup).toContain("Expand section");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("Data stays on this device");
    expect(markup).toContain("sm:grid-cols-2");
    expect(markup).toContain("xl:grid-cols-4");
    expect(markup).toContain("min-h-11");
  });

  it("renders the signed-out Google representation without showing a fake active session", async () => {
    const authProvider = new TestAuthProvider("future-auth", {
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

    const markup = await renderCardToStaticMarkup(boundary, authProvider);

    expect(markup).toContain("Signed out");
    expect(markup).toContain("Google sign-in");
    expect(markup).toContain("This device");
    expect(markup).toContain("Never synced");
    expect(markup).toContain("Preparing sync");
    expect(markup).toContain("Connected devices");
    expect(markup).toContain("1 device(s)");
    expect(markup).toContain(
      "Sign in with Google on this device to attach a real account identity to AliOS without uploading your records or enabling sync."
    );
    expect(markup).toContain(
      "Only clearly listed future sync-eligible records could ever leave this device, and only after the user reviews that scope."
    );
    expect(markup).toContain(
      "Personal Manual content, conflict-free local work, backups, recovery data, and every unsynced category remain available on this device even when sync is connected."
    );
    expect(markup).toContain("Retry sync");
    expect(markup).toContain("Google sign-in");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Enable sync - Sign in first");
  });

  it("renders a signed-in Google representation with account details and sign-out messaging", async () => {
    const authProvider = new TestAuthProvider("future-auth", {
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        avatarUrl: "https://example.com/avatar.png",
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
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
            metadata: {
              googleSubject: "google-sub-1",
              avatarUrl: "https://example.com/avatar.png",
            },
          },
          detail: "Google account connected on this device.",
          lastAuthenticatedAt: "2026-07-28T00:00:00.000Z",
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

    const markup = await renderCardToStaticMarkup(boundary, authProvider);

    expect(markup).toContain("Signed in");
    expect(markup).toContain("Google sign-in");
    expect(markup).toContain("AliOS User");
    expect(markup).toContain("user@example.com");
    expect(markup).toContain("Account session actions");
    expect(markup).toContain("Retry sync");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("Manage account");
  });

  it("renders the connected preference-sync state with sync timing metadata", async () => {
    const authProvider = new TestAuthProvider("future-auth", {
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
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
          },
          detail: "Google account connected on this device.",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("supabase", {
        mode: "ready",
        provider: "supabase",
        scopes: ["preferences", "tasks", "projects", "goals", "finance"],
        connectedUserId: "supabase-user-1",
        deviceId: "device-1",
        deviceLabel: "This device",
        lastSyncedAt: "2026-07-28T12:00:00.000Z",
        lastAttemptAt: "2026-07-28T12:00:00.000Z",
        categoryStatuses: [
          {
            key: "finance",
            state: "ready",
            detail:
              "Finance transactions and obligations are sync-eligible in this stage; budgets remain derived from those records.",
            lastSyncedAt: "2026-07-28T12:00:00.000Z",
            enabled: true,
            privacyLevel: "sensitive",
            visibility: "synced",
          },
          {
            key: "manual",
            state: "planned",
            detail:
              "Personal Manual remains local-only for content, but this device is now prepared to sync readiness metadata.",
            lastSyncedAt: "2026-07-28T11:00:00.000Z",
            itemCount: 3,
            enabled: false,
            privacyLevel: "private",
            visibility: "metadata-only",
          },
        ],
        manualPreparation: {
          entryCount: 3,
          readiness: "ready",
          lastModifiedAt: "2026-07-28T11:00:00.000Z",
          detail:
            "Personal Manual remains local-only for content, but this device is now prepared to sync readiness metadata.",
        },
        lastTrustedDevice: {
          deviceId: "device-2",
          label: "Phone",
          lastSyncedAt: "2026-07-28T11:45:00.000Z",
        },
        connectedDevices: [
          {
            deviceId: "device-1",
            label: "This device",
            lastSyncedAt: "2026-07-28T12:00:00.000Z",
          },
          {
            deviceId: "device-2",
            label: "Phone",
            lastSyncedAt: "2026-07-28T11:45:00.000Z",
          },
        ],
        detail:
          "AliOS synced preferences, tasks, projects, goals, and finance records for this device.",
      }),
    });

    const markup = await renderCardToStaticMarkup(boundary, authProvider);

    expect(markup).toContain("Sync available");
    expect(markup).toContain("2026-07-28T12:00:00.000Z");
    expect(markup).toContain(
      "AliOS synced preferences, tasks, projects, goals, and finance records for this device."
    );
    expect(markup).toContain("Preferences");
    expect(markup).toContain("Tasks");
    expect(markup).toContain("Projects");
    expect(markup).toContain("Goals");
    expect(markup).toContain("Finance");
    expect(markup).toContain("Personal Manual readiness");
    expect(markup).toContain("3 items");
    expect(markup).toContain("Sync privacy");
    expect(markup).toContain("Last trusted device");
    expect(markup).toContain("Privacy: Sensitive");
    expect(markup).toContain("Visibility: Synced");
    expect(markup).toContain("Sync healthy");
    expect(markup).toContain("Multi-device sync experience");
    expect(markup).toContain("Sync completed");
    expect(markup).toContain("Connected devices");
    expect(markup).toContain("2 device(s)");
    expect(markup).toContain("Last successful sync: 2026-07-28T12:00:00.000Z");
    expect(markup).toContain("Phone");
  });

  it("renders the offline sync presentation when connectivity-style errors are reported", async () => {
    const authProvider = new TestAuthProvider("future-auth", {
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
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
          },
          detail: "Google account connected on this device.",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("supabase", {
          mode: "error",
          provider: "supabase",
          issue: "connectivity",
          scopes: ["preferences", "tasks", "projects", "goals", "finance"],
          connectedUserId: "supabase-user-1",
        deviceId: "device-1",
        deviceLabel: "This device",
        lastSyncedAt: "2026-07-28T11:00:00.000Z",
        lastAttemptAt: "2026-07-28T12:00:00.000Z",
        detail: "Connection dropped before sync could finish.",
      }),
    });

    const markup = await renderCardToStaticMarkup(boundary, authProvider);

    expect(markup).toContain("Offline");
    expect(markup).toContain("Sync issue detected");
    expect(markup).toContain("Offline recovery");
    expect(markup).toContain("Retry sync");
    expect(markup).toContain("Connection dropped before sync could finish.");
  });

  it("renders the conflict review list with local and synced version details", async () => {
    const authProvider = new TestAuthProvider("future-auth", {
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
      },
      detail: "Authenticated Google session.",
    });
    const conflicts: readonly SyncConflictRecord[] = [
      {
        entity: "tasks",
        recordId: "task-1",
        title: "Prepare weekly review notes",
        conflictAt: "2026-07-28T12:00:00.000Z",
        conflictReason: "diverged-updates",
        localUpdatedAt: "2026-07-28T11:40:00.000Z",
        localLastSyncedAt: "2026-07-28T09:00:00.000Z",
        localDeviceId: "device-1",
        localDeviceLabel: "This device",
        remoteUpdatedAt: "2026-07-28T11:45:00.000Z",
        remoteLastSyncedAt: "2026-07-28T09:00:00.000Z",
        remoteDeviceId: "device-2",
        remoteDeviceLabel: "Other device",
      },
    ];
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
          },
          detail: "Google account connected on this device.",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider(
        "supabase",
        {
          mode: "error",
          provider: "supabase",
          issue: "conflict",
          conflictCount: 1,
          scopes: ["preferences", "tasks", "projects", "goals", "finance"],
          connectedUserId: "supabase-user-1",
          deviceId: "device-1",
          deviceLabel: "This device",
          lastSyncedAt: "2026-07-28T09:00:00.000Z",
          lastAttemptAt: "2026-07-28T12:00:00.000Z",
          detail: "AliOS preserved your local data and flagged a competing task update.",
        },
        {
          conflicts,
        }
      ),
    });

    const markup = await renderCardToStaticMarkup(boundary, authProvider);

    expect(markup).toContain("Hide conflict review");
    expect(markup).toContain("Conflict review required");
    expect(markup).toContain("Prepare weekly review notes");
    expect(markup).toContain("Local device version");
    expect(markup).toContain("Synced version");
    expect(markup).toContain("This device");
    expect(markup).toContain("Other device");
    expect(markup).toContain("Keep local version");
    expect(markup).toContain("Keep synced version");
  });

  it("shows the empty conflict review state after opening a clean sync surface", async () => {
    const authProvider = new TestAuthProvider("future-auth", {
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
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
          },
          detail: "Google account connected on this device.",
        },
        {
          status: "authenticated",
          available: ["account-identity", "sign-out", "explicit-sync-opt-in"],
          detail: "Authenticated account capabilities are available.",
        }
      ),
      authProvider,
      syncProvider: new TestSyncProvider("supabase", {
        mode: "ready",
        provider: "supabase",
        scopes: ["preferences", "tasks", "projects", "goals", "finance"],
        connectedUserId: "supabase-user-1",
        deviceId: "device-1",
        deviceLabel: "This device",
        lastSyncedAt: "2026-07-28T12:00:00.000Z",
        lastAttemptAt: "2026-07-28T12:00:00.000Z",
        detail:
          "AliOS synced preferences, tasks, projects, goals, and finance records for this device.",
      }),
    });

    const markup = await renderCardToStaticMarkup(boundary, authProvider);

    expect(markup).toContain("No conflicts");
    expect(markup).toContain(
      "No sync conflicts currently need review on this device."
    );
  });

  it("renders the Persian account and sync copy for the settings surface", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = await renderCardToStaticMarkup();

    expect(markup).toContain(messagesFa["settings.accountSyncTitle"]);
    expect(markup).toContain(messagesFa["settings.syncStatusLocalOnly"]);
    expect(markup).toContain(messagesFa["settings.accountSyncSnapshotLabel"]);
    expect(markup).toContain(messagesFa["settings.syncStatesTitle"]);
    expect(markup).toContain(messagesFa["settings.syncPrivacySectionTitle"]);
    expect(markup).toContain(messagesFa["settings.syncStatusConflict"]);
    expect(markup).toContain(messagesFa["settings.accountCreateAction"]);
    expect(markup).toContain(messagesFa["settings.accountEnableSyncAction"]);
  });
});
