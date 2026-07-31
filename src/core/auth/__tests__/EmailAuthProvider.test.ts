import { beforeEach, describe, expect, it } from "vitest";

import { EmailAccountProvider } from "@/core/account/EmailAccountProvider";
import { EMAIL_ACCOUNT_PROVIDER_ID } from "@/core/account/types";
import type { SupabaseBrowserClient, SupabaseSession } from "@/core/sync/supabaseClient";

import { EmailAuthProvider } from "../EmailAuthProvider";
import { EmailAuthRuntime } from "../emailAuthRuntime";

function createSession(
  overrides: Partial<SupabaseSession> = {}
): SupabaseSession {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_at: Math.floor(new Date("2026-08-01T12:00:00.000Z").getTime() / 1000),
    user: {
      id: "user-1",
      user_metadata: {
        email: "user@example.com",
        display_name: "AliOS User",
      },
    },
    ...overrides,
  };
}

function createClientHarness() {
  let session: SupabaseSession | null = null;

  const client: SupabaseBrowserClient = {
    auth: {
      getSession: async () => ({
        data: { session },
        error: null,
      }),
      restoreSessionFromUrlHash: async () => ({
        data: { session: null, consumed: false },
        error: null,
      }),
      signUpWithPassword: async ({ email }) => ({
        data: {
          session: null,
          user: {
            id: "pending-user",
            user_metadata: {
              email,
            },
          },
        },
        error: null,
      }),
      signInWithPassword: async ({ email }) => {
        session = createSession({
          user: {
            id: "user-1",
            user_metadata: {
              email,
              display_name: "AliOS User",
            },
          },
        });

        return {
          data: { session },
          error: null,
        };
      },
      signInWithIdToken: async () => ({
        data: { session: null },
        error: new Error("Not used in email auth test."),
      }),
      refreshSession: async () => ({
        data: { session },
        error: null,
      }),
      updateUser: async () => ({
        data: { user: session?.user ?? null },
        error: null,
      }),
      signOut: async () => {
        session = null;
        return { error: null };
      },
    },
    records: {
      list: async () => ({ data: [], error: null }),
      upsert: async () => ({ data: [], error: null }),
    },
  };

  return {
    client,
    getSession: () => session,
    setSession(nextSession: SupabaseSession | null) {
      session = nextSession;
    },
  };
}

describe("EmailAuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates an email account and reports verification when Supabase requires it", async () => {
    const harness = createClientHarness();
    const runtime = new EmailAuthRuntime({
      client: harness.client,
      now: () => new Date("2026-07-30T10:00:00.000Z"),
    });
    const authProvider = new EmailAuthProvider(runtime);

    const result = await authProvider.createAccount({
      email: "user@example.com",
      password: "secret123",
    });

    expect(result).toMatchObject({
      requiresVerification: true,
      session: {
        status: "unauthenticated",
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
      },
    });
    expect(harness.getSession()).toBeNull();
  });

  it("signs in with email, restores the current session, and exposes the account identity", async () => {
    const harness = createClientHarness();
    const now = new Date("2026-07-30T11:15:00.000Z");
    const runtime = new EmailAuthRuntime({
      client: harness.client,
      now: () => now,
    });
    const authProvider = new EmailAuthProvider(runtime);
    const accountProvider = new EmailAccountProvider(runtime);

    await expect(
      authProvider.login({
        email: "user@example.com",
        password: "secret123",
      })
    ).resolves.toMatchObject({
      session: {
        status: "authenticated",
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
        user: {
          userId: "user-1",
          email: "user@example.com",
          displayName: "AliOS User",
        },
      },
    });

    await expect(authProvider.getCurrentSession()).resolves.toMatchObject({
      status: "authenticated",
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      user: {
        email: "user@example.com",
      },
    });

    await expect(accountProvider.getCurrentSession()).resolves.toMatchObject({
      status: "authenticated",
      providerId: EMAIL_ACCOUNT_PROVIDER_ID,
      lifecycle: "signed-in",
      identity: {
        accountId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
      },
    });

    const restoredRuntime = new EmailAuthRuntime({
      client: harness.client,
      now: () => now,
    });
    const restoredProvider = new EmailAuthProvider(restoredRuntime);
    await expect(restoredProvider.getCurrentSession()).resolves.toMatchObject({
      status: "authenticated",
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      user: {
        email: "user@example.com",
      },
    });
  });

  it("signs out cleanly and clears the authenticated runtime state", async () => {
    const harness = createClientHarness();
    harness.setSession(createSession());
    const runtime = new EmailAuthRuntime({
      client: harness.client,
      now: () => new Date("2026-07-30T12:00:00.000Z"),
    });
    const authProvider = new EmailAuthProvider(runtime);

    await authProvider.logout();

    expect(harness.getSession()).toBeNull();
    await expect(authProvider.getCurrentSession()).resolves.toMatchObject({
      status: "unauthenticated",
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      user: null,
    });
  });
});
