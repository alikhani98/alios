import { describe, expect, it, vi } from "vitest";

import { SupabasePreferenceSyncProvider } from "@/core/sync";
import type { AuthProvider, AuthSession } from "@/core/auth";
import type { GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import type { AccountProvider, AccountSessionBoundary } from "../types";

import {
  LOCAL_ONLY_ACCOUNT_RUNTIME_STATE,
  LOCAL_ONLY_AUTH_SESSION,
  LOCAL_ONLY_SYNC_CAPABILITY,
  LOCAL_ONLY_SYNC_STATUS,
  createAccountRuntimeBoundary,
  localOnlyAccountRuntimeBoundary,
} from "../runtimeBoundary";

function createRuntimeStub(session: AuthSession, idToken = "google-id-token") {
  return {
    getSession: () => session,
    getIdToken: () => idToken,
    subscribe: () => ({ unsubscribe: () => undefined }),
  } as unknown as GoogleAuthRuntime;
}

function createAuthenticatedAccountProvider(): AccountProvider {
  const session: AccountSessionBoundary = {
    status: "authenticated",
    providerId: "email",
    lifecycle: "signed-in",
    identity: {
      accountId: "user-1",
      email: "user@example.com",
      displayName: "AliOS User",
      providerId: "email",
      createdAt: "2026-07-28T00:00:00.000Z",
      updatedAt: "2026-07-28T12:00:00.000Z",
    },
    detail: "Email account connected on this device.",
  };

  return {
    providerId: "email",
    getStatus: async () => "authenticated",
    getCapabilities: async () => ({
      status: "authenticated",
      available: ["account-identity", "session-refresh", "sign-out", "explicit-sync-opt-in"],
      detail: "Account actions are available.",
    }),
    getCurrentIdentity: async () => session.identity,
    getCurrentSession: async () => session,
    authenticate: async () => ({ session }),
    restoreIdentity: async () => session,
    refreshSession: async () => session,
    signOut: async () => undefined,
    subscribe: () => ({ unsubscribe: () => undefined }),
  };
}

function createAuthenticatedAuthProvider(): AuthProvider {
  const session: AuthSession = {
    status: "authenticated",
    provider: "email",
    user: {
      userId: "user-1",
      email: "user@example.com",
      displayName: "AliOS User",
      createdAt: "2026-07-28T00:00:00.000Z",
      updatedAt: "2026-07-28T12:00:00.000Z",
    },
    detail: "Email account connected on this device.",
  };

  return {
    name: "email",
    getCurrentUser: async () => session.user,
    getCurrentSession: async () => session,
    login: async () => ({ session }),
    logout: async () => undefined,
    refreshSession: async () => session,
    subscribe: () => ({ unsubscribe: () => undefined }),
  };
}

describe("account runtime boundary", () => {
  it("keeps the default runtime fully local-only", async () => {
    await expect(localOnlyAccountRuntimeBoundary.getState()).resolves.toMatchObject({
      accountProviderId: "local-only",
      localOnly: true,
      hasActiveAccount: false,
      accountStatus: "local-only",
      authStatus: "unauthenticated",
      sessionLifecycle: "local-only",
      identity: null,
      accountCapabilities: {
        status: "local-only",
        available: [],
      },
      syncCapability: {
        availability: "local-only",
        enabled: false,
      },
      syncStatus: {
        mode: "local-only",
        provider: "local-only",
      },
      syncMetadata: {
        state: "local-only",
        lastOutcome: "never",
        device: {
          deviceId: "local-device",
          label: "This device",
        },
      },
    });
  });

  it("exposes explicit local-only defaults for auth and sync without enabling user state", () => {
    expect(LOCAL_ONLY_AUTH_SESSION).toMatchObject({
      status: "unauthenticated",
      provider: "local-only",
      user: null,
    });
    expect(LOCAL_ONLY_SYNC_CAPABILITY).toMatchObject({
      availability: "local-only",
      enabled: false,
    });
    expect(LOCAL_ONLY_SYNC_STATUS).toMatchObject({
      mode: "local-only",
      provider: "local-only",
    });
    expect(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.hasActiveAccount).toBe(false);
    expect(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.sessionLifecycle).toBe("local-only");
    expect(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.syncMetadata.lastOutcome).toBe("never");
  });

  it("supports runtime subscription without implying an active account session", async () => {
    const listener = vi.fn();

    const subscription = localOnlyAccountRuntimeBoundary.subscribe(listener);
    for (let attempt = 0; attempt < 5 && listener.mock.calls.length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        accountStatus: "local-only",
        authStatus: "unauthenticated",
        accountProviderId: "local-only",
        sessionLifecycle: "local-only",
        identity: null,
        localOnly: true,
      })
    );

    expect(subscription.unsubscribe).toBeTypeOf("function");
    subscription.unsubscribe();
  });

  it("exposes a local-only sync action without activating any remote behavior", async () => {
    await expect(localOnlyAccountRuntimeBoundary.syncNow()).resolves.toMatchObject({
      mode: "local-only",
      provider: "local-only",
    });
  });

  it("initializes account runtime state once with a configured Supabase sync provider", async () => {
    const syncProvider = new SupabasePreferenceSyncProvider({
      client: {
        auth: {
          getSession: async () => ({
            data: { session: null },
            error: null,
          }),
          signInWithIdToken: async () => ({
            data: { session: null },
            error: null,
          }),
          updateUser: async () => ({
            data: { user: null },
            error: null,
          }),
          signOut: async () => ({ error: null }),
        },
        records: {
          list: async () => ({
            data: [],
            error: null,
          }),
          upsert: async ({ rows }) => ({
            data: rows,
            error: null,
          }),
        },
      },
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

    const boundary = createAccountRuntimeBoundary({
      accountProvider: createAuthenticatedAccountProvider(),
      authProvider: createAuthenticatedAuthProvider(),
      syncProvider,
    });
    const listener = vi.fn();

    const subscription = boundary.subscribe(listener);

    for (let attempt = 0; attempt < 5 && listener.mock.calls.length === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(listener.mock.calls.length).toBeLessThanOrEqual(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        accountStatus: "authenticated",
        authStatus: "authenticated",
        accountProviderId: "email",
        syncStatus: expect.objectContaining({
          mode: "local-only",
          provider: "supabase",
          enabled: false,
        }),
      })
    );

    subscription.unsubscribe();
  });
});
