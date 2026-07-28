import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackupStorage } from "@/core/backup";
import type { AuthSession } from "@/core/auth";
import type { GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { Goal, Project, Task } from "@/shared/types";

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
  projects?: Project[];
  goals?: Goal[];
}) {
  let data = {
    dailyCheckins: [],
    tasks: input?.tasks ?? [],
    goals: input?.goals ?? [],
    lifeAreas: [],
    decisionLogEntries: [],
    manualEntries: [],
    financeTransactions: [],
    financeObligations: [],
    projects: input?.projects ?? [],
    journalEntries: [],
    knowledgeItems: [],
    settings: [],
    inboxItems: [],
    routines: [],
    weeklyPlans: [],
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
        projects: [],
        goals: [],
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
      scopes: ["preferences"],
      connectedUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
    });
  });

  it("syncs tasks, projects, and goals through the backup boundary while preserving local-first ownership", async () => {
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
      scopes: ["preferences", "tasks", "projects", "goals"],
      connectedUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
    });
    expect(harness.client.records.upsert).toHaveBeenCalledTimes(1);

    const upsertRows = harness.client.records.upsert.mock.calls[0][0]
      .rows as unknown as ReadonlyArray<{
      entity: string;
      record_id: string;
      payload: { sync?: { ownerUserId?: string } };
    }>;
    expect(upsertRows).toHaveLength(3);
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
        expect.objectContaining({ entity: "projects", record_id: "project-1" }),
        expect.objectContaining({ entity: "goals", record_id: "goal-1" }),
      ])
    );

    const syncedData = backupHarness.getData();
    expect(syncedData.tasks[0].sync).toMatchObject({
      ownerUserId: "supabase-user-1",
      lastSyncedAt: "2026-07-28T12:00:00.000Z",
      lastSyncedByDeviceId: expect.any(String),
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
