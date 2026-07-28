import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/core/auth";
import type { GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { SupabasePreferenceSyncProvider } from "../SupabasePreferenceSyncProvider";
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

function createSupabaseClientHarness(remoteMetadata?: Record<string, unknown>) {
  const session: FakeSession = {
    access_token: "supabase-access-token",
    user: {
      id: "supabase-user-1",
      user_metadata: remoteMetadata,
    },
  };

  let currentSession: FakeSession | null = null;

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
  };

  return { client, session };
}

describe("SupabasePreferenceSyncProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stays local-only when no Supabase client is configured", async () => {
    const provider = new SupabasePreferenceSyncProvider({
      createClient: () => null,
      runtime: createRuntimeStub({
        status: "authenticated",
        provider: "google",
        user: {
          userId: "google-user-1",
          email: "user@example.com",
          displayName: "AliOS User",
          createdAt: "2026-07-28T00:00:00.000Z",
          updatedAt: "2026-07-28T00:00:00.000Z",
        },
      }),
      getStorage: () => localStorage,
    });

    await expect(provider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "local-only",
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
      connectedUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
    });
  });
});
