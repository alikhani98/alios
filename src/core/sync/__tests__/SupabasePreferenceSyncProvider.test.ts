import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackupStorage } from "@/core/backup";
import type { AuthProvider, AuthSession } from "@/core/auth";
import type { GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants/preferences";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type {
  FinanceAsset,
  FinanceCategoryBudget,
  FinanceObligation,
  FinanceTransaction,
  Goal,
  ManualEntry,
  Project,
  Routine,
  Task,
} from "@/shared/types";

import { SupabasePreferenceSyncProvider } from "../SupabasePreferenceSyncProvider";
import type { SupabaseRecordRow } from "../supabaseClient";
import { SUPABASE_SYNC_METADATA_STORAGE_KEY } from "../supabaseSyncConfig";

type FakeSessionUser = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

type FakeSession = {
  access_token: string;
  user: FakeSessionUser;
};

function createRuntimeStub(
  session: AuthSession,
  idToken = "google-id-token"
): GoogleAuthRuntime {
  return {
    getSession: () => session,
    getIdToken: () => idToken,
    subscribe: () => ({ unsubscribe: () => undefined }),
  } as unknown as GoogleAuthRuntime;
}

function createAuthProviderHarness(initialSession: AuthSession) {
  return createAuthProviderHarnessWithOptions(initialSession);
}

function createAuthProviderHarnessWithOptions(
  initialSession: AuthSession,
  options: Readonly<{
    emitCurrentSessionOnSubscribe?: boolean;
  }> = {}
) {
  let currentSession = initialSession;
  const listeners = new Set<(session: AuthSession) => void>();
  const emitCurrentSessionOnSubscribe =
    options.emitCurrentSessionOnSubscribe ?? true;

  const provider: AuthProvider = {
    name: initialSession.provider,
    getCurrentUser: async () => currentSession.user,
    getCurrentSession: async () => currentSession,
    login: async () => ({ session: currentSession }),
    logout: async () => undefined,
    refreshSession: async () => currentSession,
    subscribe: (listener) => {
      listeners.add(listener);
      if (emitCurrentSessionOnSubscribe) {
        void Promise.resolve().then(() => listener(currentSession));
      }
      return {
        unsubscribe: () => {
          listeners.delete(listener);
        },
      };
    },
  };

  return {
    provider,
    setSession(nextSession: AuthSession) {
      currentSession = nextSession;
      listeners.forEach((listener) => listener(currentSession));
    },
  };
}

async function flushMicrotasks(count = 4) {
  for (let index = 0; index < count; index += 1) {
    await Promise.resolve();
  }
}

function installWindowEventHarness() {
  const eventTarget = new EventTarget();
  const previousWindow = (globalThis as { window?: unknown }).window;
  const windowStub = {
    localStorage,
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: windowStub,
  });

  return {
    window: windowStub,
    restore() {
      if (typeof previousWindow === "undefined") {
        delete (globalThis as { window?: unknown }).window;
        return;
      }

      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: previousWindow,
      });
    },
  };
}

function createSubscriptionTrackingAuthProvider(initialSession: AuthSession) {
  let currentSession = initialSession;
  let activeSubscriptions = 0;
  let maxActiveSubscriptions = 0;
  const listeners = new Set<(session: AuthSession) => void>();
  const unsubscribe = vi.fn(() => {
    activeSubscriptions -= 1;
  });
  const subscribe = vi.fn((listener: (session: AuthSession) => void) => {
    listeners.add(listener);
    activeSubscriptions += 1;
    maxActiveSubscriptions = Math.max(
      maxActiveSubscriptions,
      activeSubscriptions
    );

    return {
      unsubscribe: () => {
        if (!listeners.delete(listener)) {
          return;
        }
        unsubscribe();
      },
    };
  });

  const provider: AuthProvider = {
    name: initialSession.provider,
    getCurrentUser: async () => currentSession.user,
    getCurrentSession: async () => currentSession,
    login: async () => ({ session: currentSession }),
    logout: async () => undefined,
    refreshSession: async () => currentSession,
    subscribe,
  };

  return {
    provider,
    subscribe,
    unsubscribe,
    getActiveSubscriptions: () => activeSubscriptions,
    getMaxActiveSubscriptions: () => maxActiveSubscriptions,
  };
}

function createSupabaseClientHarness(
  remoteMetadata?: Record<string, unknown>,
  options: Readonly<{
    initialSession?: boolean;
  }> = {}
) {
  const session: FakeSession = {
    access_token: "supabase-access-token",
    user: {
      id: "supabase-user-1",
      user_metadata: remoteMetadata,
    },
  };

  let currentSession: FakeSession | null = options.initialSession
    ? {
        access_token: session.access_token,
        user: {
          ...session.user,
          user_metadata: remoteMetadata,
        },
      }
    : null;

  const client = {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: currentSession },
        error: null,
      })),
      signInWithIdToken: vi.fn(async () => {
        currentSession = {
          access_token: session.access_token,
          user: {
            ...session.user,
            user_metadata: remoteMetadata,
          },
        };

        return {
          data: { session: currentSession },
          error: null,
        };
      }),
      updateUser: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const nextUser = {
          id: session.user.id,
          user_metadata: data,
        };
        currentSession = {
          access_token: session.access_token,
          user: nextUser,
        };

        return {
          data: { user: nextUser },
          error: null,
        };
      }),
      signOut: vi.fn(async () => {
        currentSession = null;
        return { error: null };
      }),
    },
    records: {
      list: vi.fn(
        async (): Promise<{
          data: ReadonlyArray<SupabaseRecordRow>;
          error: Error | null;
        }> => ({
          data: [],
          error: null,
        })
      ),
      upsert: vi.fn(
        async ({
          rows,
        }: {
          rows: ReadonlyArray<SupabaseRecordRow>;
        }): Promise<{
          data: ReadonlyArray<SupabaseRecordRow>;
          error: Error | null;
        }> => ({
          data: rows,
          error: null,
        })
      ),
    },
  };

  return { client, session };
}

function createBackupStorageStub(input?: {
  tasks?: Task[];
  routines?: Routine[];
  projects?: Project[];
  goals?: Goal[];
  manualEntries?: ManualEntry[];
  financeTransactions?: FinanceTransaction[];
  financeObligations?: FinanceObligation[];
  financeCategoryBudgets?: FinanceCategoryBudget[];
  financeAssets?: FinanceAsset[];
}) {
  let data = {
    dailyCheckins: [],
    tasks: input?.tasks ?? [],
    goals: input?.goals ?? [],
    lifeAreas: [],
    decisionLogEntries: [],
    manualEntries: input?.manualEntries ?? [],
    financeTransactions: input?.financeTransactions ?? [],
    financeObligations: input?.financeObligations ?? [],
    financeCategoryBudgets: input?.financeCategoryBudgets ?? [],
    financeAssets: input?.financeAssets ?? [],
    projects: input?.projects ?? [],
    journalEntries: [],
    knowledgeItems: [],
    settings: [],
    inboxItems: [],
    routines: input?.routines ?? [],
    weeklyPlans: [],
    focusSessions: [],
  };

  const backupStorage: BackupStorage = {
    readAll: vi.fn(async () => structuredClone(data)),
    replaceAll: vi.fn(async (nextData) => {
      data = structuredClone(nextData);
    }),
    getSummary: vi.fn(async () => ({
      dailyCheckins: data.dailyCheckins.length,
      tasks: data.tasks.length,
      goals: data.goals.length,
      lifeAreas: data.lifeAreas.length,
      decisionLogEntries: data.decisionLogEntries.length,
      manualEntries: data.manualEntries.length,
      financeTransactions: data.financeTransactions.length,
      financeObligations: data.financeObligations.length,
      financeCategoryBudgets: data.financeCategoryBudgets.length,
      financeAssets: data.financeAssets.length,
      focusSessions: data.focusSessions.length,
      projects: data.projects.length,
      journalEntries: data.journalEntries.length,
      knowledgeItems: data.knowledgeItems.length,
      settings: data.settings.length,
      inboxItems: data.inboxItems.length,
      routines: data.routines.length,
      weeklyPlans: data.weeklyPlans.length,
    })),
    clearAll: vi.fn(async () => {
      data = {
        ...data,
        tasks: [],
        routines: [],
        projects: [],
        goals: [],
        manualEntries: [],
        financeTransactions: [],
        financeObligations: [],
        financeCategoryBudgets: [],
        financeAssets: [],
        focusSessions: [],
      };
    }),
  };

  return {
    backupStorage,
    getData: () => structuredClone(data),
  };
}

describe("SupabasePreferenceSyncProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps construction inert until explicit activation", () => {
    const authHarness = createSubscriptionTrackingAuthProvider({
      status: "authenticated",
      provider: "email",
      user: {
        userId: "supabase-user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T10:00:00.000Z",
      },
      detail: "Email account connected on this device.",
    });

    new SupabasePreferenceSyncProvider({
      authProvider: authHarness.provider,
      getStorage: () => localStorage,
    });

    expect(authHarness.subscribe).not.toHaveBeenCalled();
    expect(authHarness.getActiveSubscriptions()).toBe(0);
  });

  it("keeps the module-scope singleton inert during import", async () => {
    vi.resetModules();
    const runtimeSubscribe = vi.fn(() => ({
      unsubscribe: () => undefined,
    }));

    vi.doMock("@/core/auth/googleAuthRuntime", async () => {
      const actual =
        await vi.importActual<typeof import("@/core/auth/googleAuthRuntime")>(
          "@/core/auth/googleAuthRuntime"
        );

      return {
        ...actual,
        googleAuthRuntime: {
          ...actual.googleAuthRuntime,
          subscribe: runtimeSubscribe,
        },
      };
    });

    const module = await import("../SupabasePreferenceSyncProvider");

    expect(module.supabasePreferenceSyncProvider).toBeDefined();
    expect(runtimeSubscribe).not.toHaveBeenCalled();

    vi.doUnmock("@/core/auth/googleAuthRuntime");
    vi.resetModules();
  });

  it("subscribes only after explicit activation and cleans up idempotently", () => {
    const authHarness = createSubscriptionTrackingAuthProvider({
      status: "authenticated",
      provider: "email",
      user: {
        userId: "supabase-user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T10:00:00.000Z",
      },
      detail: "Email account connected on this device.",
    });

    const provider = new SupabasePreferenceSyncProvider({
      authProvider: authHarness.provider,
      getStorage: () => localStorage,
    });

    provider.activate();
    provider.activate();

    expect(authHarness.subscribe).toHaveBeenCalledTimes(1);
    expect(authHarness.getActiveSubscriptions()).toBe(1);
    expect(authHarness.getMaxActiveSubscriptions()).toBe(1);

    provider.deactivate();
    provider.deactivate();

    expect(authHarness.unsubscribe).toHaveBeenCalledTimes(1);
    expect(authHarness.getActiveSubscriptions()).toBe(0);
  });

  it("stays local-only when no authenticated runtime session is available", async () => {
    const harness = createSupabaseClientHarness();
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "unauthenticated",
        provider: "google",
        user: null,
      }, ""),
      getStorage: () => localStorage,
    });

    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "supabase",
      enabled: false,
    });
    await expect(provider.syncNow()).resolves.toMatchObject({
      changedRecords: 0,
      status: {
        mode: "local-only",
        provider: "local-only",
      },
    });
  });

  it("connects Supabase through the Google id token and syncs only approved preferences", async () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "dark");
    localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, "emerald");

    const harness = createSupabaseClientHarness({
      alios_preferences: {
        [LANGUAGE_STORAGE_KEY]: "en",
      },
    });
    const now = new Date("2026-07-28T12:00:00.000Z");
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => now,
    });

    const result = await provider.syncNow();

    expect(harness.client.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "google-id-token",
    });
    expect(harness.client.auth.updateUser).toHaveBeenCalledTimes(1);
    expect(harness.client.auth.updateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        alios_preferences: expect.objectContaining({
          [APPEARANCE_STORAGE_KEY]: "dark",
          [ACCENT_COLOR_STORAGE_KEY]: "emerald",
          [LANGUAGE_STORAGE_KEY]: "en",
        }),
      }),
    });

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(result).toMatchObject({
      changedRecords: 3,
      status: {
        mode: "ready",
        provider: "supabase",
        connectedUserId: "supabase-user-1",
        lastSyncedAt: "2026-07-28T12:00:00.000Z",
      },
    });

    expect(
      JSON.parse(
        localStorage.getItem(SUPABASE_SYNC_METADATA_STORAGE_KEY) ?? "{}"
      )
    ).toMatchObject({
      backendUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
      lastOutcome: "success",
    });

    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "ready",
      provider: "supabase",
      enabled: true,
      scopes: ["preferences"],
      connectedUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
    });
  });

  it("keeps a signed-in device local-only until the owner explicitly enables sync", async () => {
    const harness = createSupabaseClientHarness();
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
    });

    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "supabase",
      enabled: false,
      connectedUserId: "google-user-1",
      scopes: [],
    });
    expect(harness.client.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("enables sync for an email-authenticated device by reusing the existing Supabase session", async () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "dark");

    const harness = createSupabaseClientHarness(
      {
        alios_preferences: {
          [LANGUAGE_STORAGE_KEY]: "en",
        },
      },
      { initialSession: true }
    );
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "unauthenticated",
        provider: "google",
        user: null,
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-29T10:00:00.000Z"),
    });

    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "supabase",
      enabled: false,
      connectedUserId: "supabase-user-1",
      detail:
        "An account is connected on this device, but sync stays off until you explicitly enable it.",
    });

    const result = await provider.syncNow();

    expect(harness.client.auth.signInWithIdToken).not.toHaveBeenCalled();
    expect(result.status).toMatchObject({
      mode: "ready",
      provider: "supabase",
      enabled: true,
      connectedUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-29T10:00:00.000Z",
    });
  });

  it("does not sign out an email-backed Supabase session after activation when an unrelated Google runtime is unauthenticated", async () => {
    localStorage.setItem("alios.sync.enabled", "true");

    const harness = createSupabaseClientHarness(undefined, {
      initialSession: true,
    });
    const authHarness = createAuthProviderHarness({
      status: "authenticated",
      provider: "email",
      user: {
        userId: "supabase-user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T10:00:00.000Z",
      },
      detail: "Email account connected on this device.",
    });

    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      authProvider: authHarness.provider,
      runtime: createRuntimeStub({
        status: "unauthenticated",
        provider: "google",
        user: null,
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-29T10:00:00.000Z"),
    });

    provider.activate();
    await Promise.resolve();

    expect(harness.client.auth.signOut).not.toHaveBeenCalled();
    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "ready",
      provider: "supabase",
      enabled: true,
      connectedUserId: "supabase-user-1",
    });
    expect(localStorage.getItem("alios.sync.enabled")).toBe("true");
  });

  it("preserves the sync opt-in across provider reconstruction for an authenticated email session", async () => {
    localStorage.setItem("alios.sync.enabled", "true");

    const harness = createSupabaseClientHarness(undefined, {
      initialSession: true,
    });
    const authHarness = createAuthProviderHarness({
      status: "authenticated",
      provider: "email",
      user: {
        userId: "supabase-user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T10:00:00.000Z",
      },
      detail: "Email account connected on this device.",
    });

    const firstProvider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      authProvider: authHarness.provider,
      getStorage: () => localStorage,
      now: () => new Date("2026-07-29T10:00:00.000Z"),
    });

    await expect(firstProvider.getStatus()).resolves.toMatchObject({
      mode: "ready",
      enabled: true,
    });

    const secondProvider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      authProvider: authHarness.provider,
      getStorage: () => localStorage,
      now: () => new Date("2026-07-29T10:05:00.000Z"),
    });

    await expect(secondProvider.getStatus()).resolves.toMatchObject({
      mode: "ready",
      enabled: true,
      connectedUserId: "supabase-user-1",
    });
    expect(localStorage.getItem("alios.sync.enabled")).toBe("true");
  });

  it("clears the stored Supabase session only after an explicit sign-out reaches the active auth provider", async () => {
    localStorage.setItem("alios.sync.enabled", "true");

    const harness = createSupabaseClientHarness(undefined, {
      initialSession: true,
    });
    const authHarness = createAuthProviderHarness({
      status: "authenticated",
      provider: "email",
      user: {
        userId: "supabase-user-1",
        email: "user@example.com",
        displayName: "AliOS User",
        createdAt: "2026-07-29T10:00:00.000Z",
        updatedAt: "2026-07-29T10:00:00.000Z",
      },
      detail: "Email account connected on this device.",
    });

    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      authProvider: authHarness.provider,
      getStorage: () => localStorage,
      now: () => new Date("2026-07-29T10:00:00.000Z"),
    });

    provider.activate();
    authHarness.setSession({
      status: "unauthenticated",
      provider: "email",
      user: null,
      detail: "Email account signed out on this device.",
    });
    await Promise.resolve();

    expect(harness.client.auth.signOut).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("alios.sync.enabled")).toBeNull();
    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "supabase",
      enabled: false,
    });
  });

  it("does not notify sync subscribers when getStatus is called", async () => {
    const harness = createSupabaseClientHarness();
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
    });

    const listener = vi.fn();
    const subscription = provider.subscribe(listener);

    listener.mockClear();
    await provider.getStatus();

    expect(listener).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });

  it("does not let internally applied preference events recursively trigger another sync", async () => {
    localStorage.setItem("alios.sync.enabled", "true");
    const windowHarness = installWindowEventHarness();

    try {
      const harness = createSupabaseClientHarness(
        {
          alios_preferences: {
            [LANGUAGE_STORAGE_KEY]: "en",
          },
        },
        {
          initialSession: true,
        }
      );
      const authHarness = createAuthProviderHarnessWithOptions(
        {
          status: "authenticated",
          provider: "email",
          user: {
            userId: "supabase-user-1",
            email: "user@example.com",
            displayName: "AliOS User",
            createdAt: "2026-07-29T10:00:00.000Z",
            updatedAt: "2026-07-29T10:00:00.000Z",
          },
          detail: "Email account connected on this device.",
        },
        {
          emitCurrentSessionOnSubscribe: false,
        }
      );
      const provider = new SupabasePreferenceSyncProvider({
        client: harness.client,
        authProvider: authHarness.provider,
        getStorage: () => localStorage,
        now: () => new Date("2026-07-29T10:00:00.000Z"),
      });
      const syncSpy = vi.spyOn(provider, "syncNow");

      provider.activate();
      windowHarness.window.dispatchEvent(
        new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, {
          detail: { key: APPEARANCE_STORAGE_KEY },
        })
      );
      await flushMicrotasks();

      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(harness.client.auth.updateUser).toHaveBeenCalledTimes(1);
    } finally {
      windowHarness.restore();
    }
  });

  it("emits only one effective local preference notification for each internally applied write", async () => {
    const windowHarness = installWindowEventHarness();
    const harness = createSupabaseClientHarness(
      {
        alios_preferences: {
          [LANGUAGE_STORAGE_KEY]: "en",
        },
      },
      {
        initialSession: true,
      }
    );
    const notificationListener = vi.fn();
    windowHarness.window.addEventListener(
      LOCAL_PREFERENCE_CHANGE_EVENT,
      notificationListener
    );

    try {
      const provider = new SupabasePreferenceSyncProvider({
        client: harness.client,
        authProvider: createAuthProviderHarnessWithOptions(
          {
            status: "authenticated",
            provider: "email",
            user: {
              userId: "supabase-user-1",
              email: "user@example.com",
              displayName: "AliOS User",
              createdAt: "2026-07-29T10:00:00.000Z",
              updatedAt: "2026-07-29T10:00:00.000Z",
            },
            detail: "Email account connected on this device.",
          },
          {
            emitCurrentSessionOnSubscribe: false,
          }
        ).provider,
        getStorage: () => localStorage,
        now: () => new Date("2026-07-29T10:00:00.000Z"),
      });

      await provider.syncNow();

      expect(notificationListener).toHaveBeenCalledTimes(1);
    } finally {
      windowHarness.window.removeEventListener(
        LOCAL_PREFERENCE_CHANGE_EVENT,
        notificationListener
      );
      windowHarness.restore();
    }
  });

  it("coalesces burst preference events into one in-flight sync attempt", async () => {
    localStorage.setItem("alios.sync.enabled", "true");
    const windowHarness = installWindowEventHarness();

    try {
      const harness = createSupabaseClientHarness(
        {
          alios_preferences: {
            [LANGUAGE_STORAGE_KEY]: "en",
          },
        },
        {
          initialSession: true,
        }
      );
      let resolveUpdateUser:
        | ((value: { data: { user: FakeSessionUser | null }; error: Error | null }) => void)
        | undefined;
      harness.client.auth.updateUser.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveUpdateUser = resolve as (
              value: { data: { user: FakeSessionUser | null }; error: Error | null }
            ) => void;
          })
      );
      const authHarness = createAuthProviderHarnessWithOptions(
        {
          status: "authenticated",
          provider: "email",
          user: {
            userId: "supabase-user-1",
            email: "user@example.com",
            displayName: "AliOS User",
            createdAt: "2026-07-29T10:00:00.000Z",
            updatedAt: "2026-07-29T10:00:00.000Z",
          },
          detail: "Email account connected on this device.",
        },
        {
          emitCurrentSessionOnSubscribe: false,
        }
      );
      const provider = new SupabasePreferenceSyncProvider({
        client: harness.client,
        authProvider: authHarness.provider,
        getStorage: () => localStorage,
        now: () => new Date("2026-07-29T10:00:00.000Z"),
      });

      provider.activate();
      windowHarness.window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
      windowHarness.window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
      windowHarness.window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
      await flushMicrotasks();

      expect(harness.client.auth.updateUser).toHaveBeenCalledTimes(1);

      if (resolveUpdateUser) {
        resolveUpdateUser({
          data: {
            user: {
              id: "supabase-user-1",
              user_metadata: {
                alios_preferences: {
                  [LANGUAGE_STORAGE_KEY]: "en",
                },
              },
            },
          },
          error: null,
        });
      }
      await flushMicrotasks();
    } finally {
      windowHarness.restore();
    }
  });

  it("syncs tasks, projects, goals, finance records, and Personal Manual entries through the backup boundary while preserving local-first ownership", async () => {
    const harness = createSupabaseClientHarness();
    const backupHarness = createBackupStorageStub({
      tasks: [
        {
          id: "task-1",
          title: "Local task",
          status: "todo",
          priority: "medium",
          isMit: false,
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:00:00.000Z",
        },
      ],
      routines: [
        {
          id: "routine-1",
          title: "Morning planning",
          description: "Review priorities before opening chat apps.",
          weekdays: [1, 2, 3, 4, 5],
          priority: "medium",
          isActive: true,
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:03:00.000Z",
        },
      ],
      projects: [
        {
          id: "project-1",
          title: "Local project",
          status: "active",
          priority: "medium",
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:05:00.000Z",
        },
      ],
      goals: [
        {
          id: "goal-1",
          title: "Local goal",
          description: "Keep moving",
          area: "work",
          timeframe: "quarter",
          status: "active",
          importance: "high",
          progressPercent: 20,
          tags: [],
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:10:00.000Z",
        },
      ],
      financeTransactions: [
        {
          id: "txn-1",
          type: "expense",
          title: "Local grocery run",
          amount: 85,
          category: "groceries",
          occurredAt: "2026-07-28",
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:20:00.000Z",
        },
      ],
      financeObligations: [
        {
          id: "obl-1",
          type: "debt",
          title: "Family loan",
          totalAmount: 1000,
          paidAmount: 250,
          dueAmount: 750,
          status: "active",
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:25:00.000Z",
        },
      ],
      manualEntries: [
        {
          id: "manual-1",
          title: "Morning reset notes",
          body: "Keep the desk clean and review today before noon.",
          category: "principles",
          importance: "medium",
          status: "active",
          tags: ["habit"],
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:30:00.000Z",
        },
      ],
    });

    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      backupStorage: backupHarness.backupStorage,
    });

    const result = await provider.syncNow();

    expect(result.status).toMatchObject({
      mode: "ready",
      provider: "supabase",
      enabled: true,
      scopes: [
        "preferences",
        "tasks",
        "routines",
        "projects",
        "goals",
        "finance",
        "manual",
      ],
      connectedUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
      manualPreparation: {
        entryCount: 1,
        readiness: "ready",
        lastModifiedAt: "2026-07-28T08:30:00.000Z",
      },
    });
    expect(harness.client.records.upsert).toHaveBeenCalledTimes(1);

    const upsertRows = harness.client.records.upsert.mock.calls[0][0]
      .rows as unknown as ReadonlyArray<{
      entity: string;
      record_id: string;
      payload: { sync?: { ownerUserId?: string } };
    }>;
    expect(upsertRows).toHaveLength(7);
    expect(upsertRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: "tasks",
          record_id: "task-1",
          payload: expect.objectContaining({
            sync: expect.objectContaining({
              ownerUserId: "supabase-user-1",
            }),
          }),
        }),
        expect.objectContaining({
          entity: "routines",
          record_id: "routine-1",
        }),
        expect.objectContaining({ entity: "projects", record_id: "project-1" }),
        expect.objectContaining({ entity: "goals", record_id: "goal-1" }),
        expect.objectContaining({
          entity: "financeTransactions",
          record_id: "txn-1",
        }),
        expect.objectContaining({
          entity: "financeObligations",
          record_id: "obl-1",
        }),
        expect.objectContaining({
          entity: "manualEntries",
          record_id: "manual-1",
        }),
      ])
    );

    const syncedData = backupHarness.getData();
    expect(syncedData.tasks[0].sync).toMatchObject({
      ownerUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
      lastSyncedByDeviceId: expect.any(String),
    });
    expect(syncedData.routines[0].sync).toMatchObject({
      ownerUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
      lastSyncedByDeviceId: expect.any(String),
    });
    expect(syncedData.financeTransactions[0].sync).toMatchObject({
      ownerUserId: "supabase-user-1",
    });
    expect(syncedData.financeObligations[0].sync).toMatchObject({
      ownerUserId: "supabase-user-1",
    });
    expect(syncedData.manualEntries[0].sync).toMatchObject({
      ownerUserId: "supabase-user-1",
    });
    expect(harness.client.auth.updateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        alios_manual: {
          entryCount: 1,
          lastModifiedAt: "2026-07-28T08:30:00.000Z",
          readiness: "ready",
        },
      }),
    });
  });

  it("downloads synced Finance, routines, and Personal Manual data for a second device after sync is enabled", async () => {
    const harness = createSupabaseClientHarness();
    harness.client.records.list.mockResolvedValueOnce({
      data: [
        {
          user_id: "supabase-user-1",
          entity: "financeTransactions",
          record_id: "txn-remote-1",
          payload: {
            id: "txn-remote-1",
            type: "expense",
            title: "Remote taxi",
            amount: 42,
            category: "transport",
            occurredAt: "2026-07-28",
            createdAt: "2026-07-27T08:00:00.000Z",
            updatedAt: "2026-07-28T09:15:00.000Z",
            sync: {
              ownerUserId: "supabase-user-1",
              lastSyncedAt: "2026-07-28T09:15:00.000Z",
              lastSyncedByDeviceId: "phone-device",
            },
          },
          updated_at: "2026-07-28T09:15:00.000Z",
          created_at: "2026-07-27T08:00:00.000Z",
          last_synced_at: "2026-07-28T09:15:00.000Z",
          last_synced_by_device_id: "phone-device",
          has_conflict: false,
          conflict_reason: undefined,
        },
        {
          user_id: "supabase-user-1",
          entity: "routines",
          record_id: "routine-remote-1",
          payload: {
            id: "routine-remote-1",
            title: "Remote evening review",
            description: "Close the day with a five-minute review.",
            weekdays: [0, 1, 2, 3, 4],
            priority: "medium",
            isActive: true,
            createdAt: "2026-07-27T08:00:00.000Z",
            updatedAt: "2026-07-28T09:18:00.000Z",
            sync: {
              ownerUserId: "supabase-user-1",
              lastSyncedAt: "2026-07-28T09:18:00.000Z",
              lastSyncedByDeviceId: "phone-device",
            },
          },
          updated_at: "2026-07-28T09:18:00.000Z",
          created_at: "2026-07-27T08:00:00.000Z",
          last_synced_at: "2026-07-28T09:18:00.000Z",
          last_synced_by_device_id: "phone-device",
          has_conflict: false,
          conflict_reason: undefined,
        },
        {
          user_id: "supabase-user-1",
          entity: "manualEntries",
          record_id: "manual-remote-1",
          payload: {
            id: "manual-remote-1",
            title: "Remote rule",
            body: "Protect focus before meetings.",
            category: "principles",
            importance: "medium",
            status: "active",
            tags: ["focus"],
            createdAt: "2026-07-27T08:00:00.000Z",
            updatedAt: "2026-07-28T09:20:00.000Z",
            sync: {
              ownerUserId: "supabase-user-1",
              lastSyncedAt: "2026-07-28T09:20:00.000Z",
              lastSyncedByDeviceId: "phone-device",
            },
          },
          updated_at: "2026-07-28T09:20:00.000Z",
          created_at: "2026-07-27T08:00:00.000Z",
          last_synced_at: "2026-07-28T09:20:00.000Z",
          last_synced_by_device_id: "phone-device",
          has_conflict: false,
          conflict_reason: undefined,
        },
      ],
      error: null,
    });

    const backupHarness = createBackupStorageStub();
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      backupStorage: backupHarness.backupStorage,
    });

    const result = await provider.syncNow();
    const syncedData = backupHarness.getData();

    expect(result.status).toMatchObject({
      mode: "ready",
      enabled: true,
      scopes: [
        "preferences",
        "tasks",
        "routines",
        "projects",
        "goals",
        "finance",
        "manual",
      ],
    });
    expect(syncedData.financeTransactions[0]).toMatchObject({
      id: "txn-remote-1",
      title: "Remote taxi",
    });
    expect(syncedData.routines[0]).toMatchObject({
      id: "routine-remote-1",
      title: "Remote evening review",
    });
    expect(syncedData.manualEntries[0]).toMatchObject({
      id: "manual-remote-1",
      title: "Remote rule",
    });
  });

  it("keeps local data available and reports an error when record upsert fails", async () => {
    const harness = createSupabaseClientHarness();
    harness.client.records.upsert.mockResolvedValueOnce({
      data: [],
      error: new Error("Supabase record upsert failed.") as Error | null,
    });
    const backupHarness = createBackupStorageStub({
      tasks: [
        {
          id: "task-1",
          title: "Local task",
          status: "todo",
          priority: "medium",
          isMit: false,
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:00:00.000Z",
        },
      ],
    });

    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      backupStorage: backupHarness.backupStorage,
    });

    const result = await provider.syncNow();

    expect(result.status.mode).toBe("error");
    expect(result.status.detail).toContain("Supabase record upsert failed.");
    expect(backupHarness.getData().tasks[0].title).toBe("Local task");
  });

  it("keeps finance data local when a finance sync attempt fails", async () => {
    const harness = createSupabaseClientHarness();
    harness.client.records.upsert.mockResolvedValueOnce({
      data: [],
      error: new Error("Finance sync failed.") as Error | null,
    });
    const backupHarness = createBackupStorageStub({
      financeTransactions: [
        {
          id: "txn-1",
          type: "expense",
          title: "Rent transfer",
          amount: 400,
          category: "housing",
          occurredAt: "2026-07-28",
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:00:00.000Z",
        },
      ],
    });

    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      backupStorage: backupHarness.backupStorage,
    });

    const result = await provider.syncNow();

    expect(result.status.mode).toBe("error");
    expect(result.status.detail).toContain("Finance sync failed.");
    expect(backupHarness.getData().financeTransactions[0].title).toBe(
      "Rent transfer"
    );
  });

  it("returns to local-only status after the authenticated Supabase session signs out", async () => {
    const harness = createSupabaseClientHarness(undefined, { initialSession: true });
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "unauthenticated",
        provider: "google",
        user: null,
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-29T10:00:00.000Z"),
    });

    await provider.syncNow();
    await harness.client.auth.signOut();

    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "local-only",
      enabled: false,
      detail: "Sign in on this device to connect sync.",
    });
    expect(localStorage.getItem("alios.sync.enabled")).toBeNull();
  });

  it("retains the last successful sync timestamp after a later failed retry", async () => {
    const harness = createSupabaseClientHarness();
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
    });

    await provider.syncNow();

    harness.client.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Temporary sync failure"),
    } as never);

    const failedResult = await provider.syncNow();

    expect(failedResult.status).toMatchObject({
      mode: "error",
      issue: "provider",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
    });
  });

  it("records stale-local and stale-remote diagnostics without overwriting local safety", async () => {
    const harness = createSupabaseClientHarness();
    harness.client.records.list.mockResolvedValueOnce({
      data: [
        {
          user_id: "supabase-user-1",
          entity: "tasks",
          record_id: "task-1",
          payload: {
            id: "task-1",
            title: "Remote task title",
            status: "todo",
            priority: "medium",
            isMit: false,
            createdAt: "2026-07-27T08:00:00.000Z",
            updatedAt: "2026-07-28T10:00:00.000Z",
            sync: {
              ownerUserId: "supabase-user-1",
              lastSyncedAt: "2026-07-28T09:00:00.000Z",
              lastSyncedByDeviceId: "remote-device",
            },
          },
          updated_at: "2026-07-28T10:00:00.000Z",
          created_at: "2026-07-27T08:00:00.000Z",
          last_synced_at: "2026-07-28T09:00:00.000Z",
          last_synced_by_device_id: "remote-device",
          has_conflict: false,
          conflict_reason: undefined,
        },
        {
          user_id: "supabase-user-1",
          entity: "projects",
          record_id: "project-1",
          payload: {
            id: "project-1",
            title: "Older remote project",
            status: "active",
            priority: "medium",
            createdAt: "2026-07-27T08:00:00.000Z",
            updatedAt: "2026-07-28T08:00:00.000Z",
            sync: {
              ownerUserId: "supabase-user-1",
              lastSyncedAt: "2026-07-28T08:00:00.000Z",
              lastSyncedByDeviceId: "remote-device",
            },
          },
          updated_at: "2026-07-28T08:00:00.000Z",
          created_at: "2026-07-27T08:00:00.000Z",
          last_synced_at: "2026-07-28T08:00:00.000Z",
          last_synced_by_device_id: "remote-device",
          has_conflict: false,
          conflict_reason: undefined,
        },
      ],
      error: null,
    });

    const backupHarness = createBackupStorageStub({
      tasks: [
        {
          id: "task-1",
          title: "Local stale task",
          status: "todo",
          priority: "medium",
          isMit: false,
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T08:00:00.000Z",
          sync: {
            ownerUserId: "supabase-user-1",
            lastSyncedAt: "2026-07-28T09:00:00.000Z",
            lastSyncedByDeviceId: "local-device",
          },
        },
      ],
      projects: [
        {
          id: "project-1",
          title: "Local newer project",
          status: "active",
          priority: "medium",
          createdAt: "2026-07-27T08:00:00.000Z",
          updatedAt: "2026-07-28T10:30:00.000Z",
          sync: {
            ownerUserId: "supabase-user-1",
            lastSyncedAt: "2026-07-28T08:00:00.000Z",
            lastSyncedByDeviceId: "local-device",
          },
        },
      ],
    });

    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      backupStorage: backupHarness.backupStorage,
    });

    await provider.syncNow();

    const diagnostics = JSON.parse(
      localStorage.getItem("alios.sync.diagnostics") ?? "[]"
    ) as ReadonlyArray<{
      outcome: string;
      staleLocalCount?: number;
      staleRemoteCount?: number;
    }>;

    expect(diagnostics[0]).toMatchObject({
      outcome: "success",
      staleLocalCount: 1,
      staleRemoteCount: 1,
    });
    expect(backupHarness.getData().tasks[0].title).toBe("Remote task title");
  });

  it("reuses the active sync attempt when retry is requested twice together", async () => {
    const harness = createSupabaseClientHarness();
    const provider = new SupabasePreferenceSyncProvider({
      client: harness.client,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T12:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
    });

    const firstAttempt = provider.syncNow();
    const secondAttempt = provider.syncNow();

    await expect(Promise.all([firstAttempt, secondAttempt])).resolves.toMatchObject([
      {
        status: {
          mode: "ready",
        },
      },
      {
        status: {
          mode: "ready",
        },
      },
    ]);
  });
});
