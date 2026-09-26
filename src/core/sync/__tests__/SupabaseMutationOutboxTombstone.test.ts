import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AliosBackupData, BackupStorage } from "@/core/backup";
import type { AuthProvider, AuthSession } from "@/core/auth";
import { taskRecord } from "@/test/factories";

import type {
  MutationOutboxEntry,
  MutationOutboxRepository,
} from "../mutationOutbox";
import { SupabasePreferenceSyncProvider } from "../SupabasePreferenceSyncProvider";
import type { SupabaseRecordRow } from "../supabaseClient";

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

function createBackupStorage(): BackupStorage {
  let data = {
    dailyCheckins: [],
    tasks: [],
    goals: [],
    lifeAreas: [],
    decisionLogEntries: [],
    manualEntries: [],
    financeTransactions: [],
    financeObligations: [],
    financeCategoryBudgets: [],
    financeAssets: [],
    focusSessions: [],
    projects: [],
    journalEntries: [],
    knowledgeItems: [],
    resources: [],
    settings: [],
    inboxItems: [],
    routines: [],
    weeklyPlans: [],
    attachments: [],
  } as AliosBackupData;

  return {
    readAll: vi.fn(async () => structuredClone(data)),
    replaceAll: vi.fn(async (nextData) => {
      data = structuredClone(nextData);
    }),
    getSummary: vi.fn(async () => ({} as never)),
    clearAll: vi.fn(async () => undefined),
  };
}

function createDeleteOutbox(
  deletedAt: string
): MutationOutboxRepository {
  const pending: MutationOutboxEntry = {
    id: "outbox-delete-1",
    entity: "tasks",
    operation: "delete",
    recordId: taskRecord.id,
    payload: taskRecord,
    createdAt: "2026-09-26T09:55:00.000Z",
    updatedAt: "2026-09-26T09:55:00.000Z",
    deletedAt,
    status: "pending",
    attemptCount: 0,
    idempotencyKey: "outbox-delete-1",
  };
  let current = pending;

  return {
    enqueue: async () => pending,
    list: async () => [current],
    listPending: async () => [current],
    getById: async () => current,
    recoverExpiredProcessing: async () => 0,
    listReady: async () => (current.status === "pending" ? [current] : []),
    claim: async () => {
      current = {
        ...current,
        status: "processing",
        attemptCount: 1,
        processingStartedAt: deletedAt,
        lastAttemptAt: deletedAt,
      };
      return current;
    },
    acknowledge: async () => {
      current = {
        ...current,
        status: "acknowledged",
        processingStartedAt: undefined,
      };
    },
    markRetryWait: async () => undefined,
    markBlockedConflict: async () => undefined,
  };
}

describe("Supabase mutation outbox tombstones", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("propagates a delete as a tombstone without reapplying the missing local record", async () => {
    const deletedAt = "2026-09-26T10:00:00.000Z";
    const remoteRows: SupabaseRecordRow[] = [
      {
        user_id: "supabase-user-1",
        entity: "tasks",
        record_id: taskRecord.id,
        payload: taskRecord as unknown as Record<string, unknown>,
        updated_at: taskRecord.updatedAt,
        created_at: taskRecord.createdAt,
      },
    ];
    const tombstone = vi.fn(
      async ({
        entity,
        recordId,
        deletedAt: remoteDeletedAt,
        previousRecord,
      }: {
        entity: string;
        recordId: string;
        deletedAt: string;
        previousRecord?: Readonly<Record<string, unknown>>;
      }) => ({
        data: [
          {
            ...remoteRows[0],
            entity,
            record_id: recordId,
            payload: {
              __aliosTombstone: true,
              deletedAt: remoteDeletedAt,
              previousRecord,
            },
            updated_at: remoteDeletedAt,
          },
        ],
        error: null,
      })
    );
    const client = {
      auth: {
        getSession: vi.fn(async () => ({
          data: {
            session: {
              access_token: "access-token",
              user: { id: "supabase-user-1" },
            },
          },
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
        list: vi.fn(async () => ({ data: remoteRows, error: null })),
        upsert: vi.fn(async ({ rows }: { rows: ReadonlyArray<SupabaseRecordRow> }) => ({
          data: rows,
          error: null,
        })),
        tombstone,
      },
    };
    const outbox = createDeleteOutbox(deletedAt);
    const provider = new SupabasePreferenceSyncProvider({
      client,
      authProvider: createAuthProvider(),
      backupStorage: createBackupStorage(),
      mutationOutboxRepository: outbox,
      getStorage: () => localStorage,
      now: () => new Date(deletedAt),
    });

    const result = await provider.syncNow();

    expect(result.status.mode).toBe("ready");
    expect(tombstone).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "tasks",
        recordId: taskRecord.id,
        deletedAt,
        previousRecord: taskRecord,
      })
    );
    expect((await outbox.getById("outbox-delete-1"))?.status).toBe(
      "acknowledged"
    );
    expect(client.records.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [] })
    );
  });
});
