// @vitest-environment jsdom
import React, { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  localOnlyAccountProvider,
  useAccountRuntime,
  type AccountRuntimeBoundary,
} from "@/core/account";
import type { AuthProvider, AuthSession } from "@/core/auth";
import type { SupabaseRecordRow } from "@/core/sync/supabaseClient";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { taskInput } from "@/test/factories";

import { AppProviders } from "../providers";

const supabaseClientHarness = vi.hoisted(() => ({
  client: undefined as unknown,
}));

vi.mock("@/core/sync/supabaseClient", async () => {
  const actual =
    await vi.importActual<typeof import("@/core/sync/supabaseClient")>(
      "@/core/sync/supabaseClient"
    );

  return {
    ...actual,
    createSupabaseBrowserClient: vi.fn(
      () =>
        supabaseClientHarness.client as ReturnType<
          typeof actual.createSupabaseBrowserClient
        >
    ),
  };
});

function createAuthProvider(): AuthProvider {
  const session: AuthSession = {
    status: "authenticated",
    provider: "email",
    user: {
      userId: "supabase-user-1",
      email: "user@example.com",
      displayName: "AliOS User",
      createdAt: "2026-09-26T09:00:00.000Z",
      updatedAt: "2026-09-26T09:00:00.000Z",
    },
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

function createSupabaseClient() {
  const session = {
    access_token: "access-token",
    user: {
      id: "supabase-user-1",
      user_metadata: {},
    },
  };

  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session },
        error: null,
      })),
      signInWithIdToken: vi.fn(),
      updateUser: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        data: { user: { id: "supabase-user-1", user_metadata: data } },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    records: {
      list: vi.fn(async () => ({
        data: [] as SupabaseRecordRow[],
        error: null,
      })),
      upsert: vi.fn(async ({ rows }: { rows: ReadonlyArray<SupabaseRecordRow> }) => ({
        data: rows,
        error: null,
      })),
    },
  };
}

function AccountRuntimeProbe({
  onReady,
}: Readonly<{ onReady: (boundary: AccountRuntimeBoundary) => void }>) {
  const { boundary } = useAccountRuntime();

  useEffect(() => {
    onReady(boundary);
  }, [boundary, onReady]);

  return <span>account runtime ready</span>;
}

describe("AppProviders sync outbox injection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes the Dexie outbox repository through AppProviders into the Supabase processor path", async () => {
    const { database, storage } = await createTestStorage();
    const client = createSupabaseClient();
    supabaseClientHarness.client = client;
    const createdTask = await storage.tasks.create(taskInput);
    const [outboxEntry] = await storage.mutationOutbox.list();
    const container = document.createElement("div");
    const root = createRoot(container);
    const runtimeBoundaryRef: { current?: AccountRuntimeBoundary } = {};

    document.body.appendChild(container);

    try {
      await act(async () => {
        root.render(
          <AppProviders
            loadStorageAdapter={async () => storage}
            accountProvider={localOnlyAccountProvider}
            authProvider={createAuthProvider()}
          >
            <AccountRuntimeProbe
              onReady={(boundary) => {
                runtimeBoundaryRef.current = boundary;
              }}
            />
          </AppProviders>
        );
      });

      await act(async () => {
        await Promise.resolve();
      });

      const runtimeBoundary = runtimeBoundaryRef.current;
      expect(runtimeBoundary).not.toBeNull();
      if (!runtimeBoundary) {
        throw new Error("Account runtime boundary was not mounted.");
      }
      await expect(runtimeBoundary.syncNow()).resolves.toMatchObject({
        mode: "ready",
        provider: "supabase",
      });

      expect(client.records.list).toHaveBeenCalledWith(
        expect.objectContaining({
          entities: expect.arrayContaining(["tasks"]),
          userId: "supabase-user-1",
        })
      );
      expect(client.records.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({
              entity: "tasks",
              record_id: createdTask.id,
            }),
          ]),
        })
      );
      await expect(
        storage.mutationOutbox.getById(outboxEntry.id)
      ).resolves.toMatchObject({
        status: "acknowledged",
        recordId: createdTask.id,
      });
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      await destroyTestDatabase(database);
    }
  });
});
