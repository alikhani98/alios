import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AliosBackupData, BackupStorage } from "@/core/backup";
import type { AuthProvider, AuthSession } from "@/core/auth";
import {
  financeObligationRecord,
  financeTransactionRecord,
  goalRecord,
  manualEntryRecord,
  projectRecord,
  routineRecord,
  taskRecord,
} from "@/test/factories";
import type {
  FinanceObligation,
  FinanceTransaction,
  Goal,
  ManualEntry,
  Project,
  Routine,
  Task,
} from "@/shared/types";

import type {
  MutationOutboxEntry,
  MutationOutboxEntity,
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
    dailyCommitments: [],
    urgeEntries: [],
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
    experiments: [],
    experimentLogs: [],
    ifThenPlans: [],
    moneyPauses: [],
    therapyNotes: [],
  } as AliosBackupData;

  return {
    readAll: vi.fn(async () => structuredClone(data)),
    replaceAll: vi.fn(async (nextData: AliosBackupData) => {
      data = structuredClone(nextData);
    }),
    getSummary: vi.fn(async () => ({} as never)),
    clearAll: vi.fn(async () => undefined),
  };
}

function createDeleteOutbox(
  input: Readonly<{
    deletedAt: string;
    entity?: MutationOutboxEntity;
    record?: SyncableTombstoneRecord;
  }>
): MutationOutboxRepository {
  const entity = input.entity ?? "tasks";
  const record = input.record ?? taskRecord;
  const pending: MutationOutboxEntry = {
    id: `outbox-delete-${entity}`,
    entity,
    operation: "delete",
    recordId: record.id,
    payload: record as unknown as Record<string, unknown>,
    createdAt: "2026-09-26T09:55:00.000Z",
    updatedAt: "2026-09-26T09:55:00.000Z",
    deletedAt: input.deletedAt,
    status: "pending",
    attemptCount: 0,
    idempotencyKey: `outbox-delete-${entity}`,
  };
  let current = pending;

  return {
    enqueue: async () => pending,
    list: async () => [current],
    listPending: async () => [current],
    getById: async () => current,
    recoverExpiredProcessing: async () => 0,
    listReady: async (now) => {
      if (current.status === "pending") {
        return [current];
      }
      if (
        current.status === "retry-wait" &&
        current.nextAttemptAt &&
        current.nextAttemptAt <= now
      ) {
        return [current];
      }
      return [];
    },
    claim: async (_id, now) => {
      current = {
        ...current,
        status: "processing",
        attemptCount: current.attemptCount + 1,
        processingStartedAt: now,
        lastAttemptAt: now,
        nextAttemptAt: undefined,
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
    markRetryWait: async (_id, retryInput) => {
      current = {
        ...current,
        status: "retry-wait",
        updatedAt: retryInput.now,
        processingStartedAt: undefined,
        nextAttemptAt: retryInput.nextAttemptAt,
        lastError: retryInput.error,
      };
    },
    markBlockedConflict: async (_id, conflictInput) => {
      current = {
        ...current,
        status: "blocked-conflict",
        updatedAt: conflictInput.now,
        processingStartedAt: undefined,
        nextAttemptAt: undefined,
        lastError: conflictInput.error,
      };
    },
  };
}

type SyncableTombstoneRecord =
  | Task
  | Routine
  | Project
  | Goal
  | FinanceTransaction
  | FinanceObligation
  | ManualEntry;

type TombstoneCase = Readonly<{
  entity: MutationOutboxEntity;
  record: SyncableTombstoneRecord;
}>;

function createRemoteRow(
  entity: MutationOutboxEntity,
  record: SyncableTombstoneRecord
): SupabaseRecordRow {
  return {
    user_id: "supabase-user-1",
    entity,
    record_id: record.id,
    payload: record as unknown as Record<string, unknown>,
    updated_at: record.updatedAt,
    created_at: record.createdAt,
  };
}

function createClient(input: Readonly<{
  remoteRows: SupabaseRecordRow[];
  tombstone?: ReturnType<typeof vi.fn>;
}>) {
  return {
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
      list: vi.fn(async () => ({ data: input.remoteRows, error: null })),
      upsert: vi.fn(async ({ rows }: { rows: ReadonlyArray<SupabaseRecordRow> }) => ({
        data: rows,
        error: null,
      })),
      tombstone:
        input.tombstone ??
        vi.fn(
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
                ...input.remoteRows[0],
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
        ),
    },
  };
}

const otherEntityCases: TombstoneCase[] = [
  { entity: "routines", record: routineRecord },
  { entity: "projects", record: projectRecord },
  { entity: "goals", record: goalRecord },
  { entity: "financeTransactions", record: financeTransactionRecord },
  { entity: "financeObligations", record: financeObligationRecord },
  { entity: "manualEntries", record: manualEntryRecord },
];

describe("Supabase mutation outbox tombstones", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("propagates a delete as a tombstone without reapplying the missing local record", async () => {
    const deletedAt = "2026-09-26T10:00:00.000Z";
    const remoteRows = [createRemoteRow("tasks", taskRecord)];
    const client = createClient({ remoteRows });
    const outbox = createDeleteOutbox({ deletedAt });
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
    expect(client.records.tombstone).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "tasks",
        recordId: taskRecord.id,
        deletedAt,
        previousRecord: taskRecord,
      })
    );
    expect((await outbox.getById("outbox-delete-tasks"))?.status).toBe(
      "acknowledged"
    );
    expect(client.records.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [] })
    );
  });

  it.each(otherEntityCases)(
    "propagates a $entity delete tombstone without reapplying the missing local record",
    async ({ entity, record }: TombstoneCase) => {
      const deletedAt = "2026-09-26T10:00:00.000Z";
      const remoteRows = [createRemoteRow(entity, record)];
      const client = createClient({ remoteRows });
      const outbox = createDeleteOutbox({ deletedAt, entity, record });
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
      expect(client.records.tombstone).toHaveBeenCalledWith(
        expect.objectContaining({
          entity,
          recordId: record.id,
          deletedAt,
          previousRecord: record,
        })
      );
      expect((await outbox.getById(`outbox-delete-${entity}`))?.status).toBe(
        "acknowledged"
      );
    }
  );

  it("blocks a delete outbox entry when the remote record changed before tombstone write", async () => {
    const deletedAt = "2026-09-26T10:00:00.000Z";
    const remoteRows = [
      createRemoteRow("tasks", {
        ...taskRecord,
        title: "Remote changed task",
        updatedAt: "2026-09-26T09:59:00.000Z",
      }),
    ];
    const client = createClient({ remoteRows });
    const outbox = createDeleteOutbox({ deletedAt });
    const provider = new SupabasePreferenceSyncProvider({
      client,
      authProvider: createAuthProvider(),
      backupStorage: createBackupStorage(),
      mutationOutboxRepository: outbox,
      getStorage: () => localStorage,
      now: () => new Date(deletedAt),
    });

    const result = await provider.syncNow();

    expect(result.status).toMatchObject({
      mode: "error",
      issue: "conflict",
      conflictCount: 1,
      detail:
        "AliOS synced preferences and safe records, but some task, routine, project, goal, finance, or Personal Manual changes now need conflict review.",
    });
    expect(client.records.tombstone).not.toHaveBeenCalled();
    await expect(outbox.getById("outbox-delete-tasks")).resolves.toMatchObject({
      status: "blocked-conflict",
      lastError:
        "The deleted tasks record changed remotely and needs conflict review.",
    });
  });

  it("moves retryable tombstone write failures to retry-wait", async () => {
    const deletedAt = "2026-09-26T10:00:00.000Z";
    const remoteRows = [createRemoteRow("tasks", taskRecord)];
    const tombstone = vi.fn(async () => ({
      data: [],
      error: new Error("network timeout while writing tombstone"),
    }));
    const client = createClient({ remoteRows, tombstone });
    const outbox = createDeleteOutbox({ deletedAt });
    const provider = new SupabasePreferenceSyncProvider({
      client,
      authProvider: createAuthProvider(),
      backupStorage: createBackupStorage(),
      mutationOutboxRepository: outbox,
      getStorage: () => localStorage,
      now: () => new Date(deletedAt),
    });

    const result = await provider.syncNow();

    expect(result.status.mode).toBe("error");
    expect(result.status.detail).toContain("network timeout");
    const retryEntry = await outbox.getById("outbox-delete-tasks");
    expect(retryEntry).toMatchObject({
      status: "retry-wait",
      attemptCount: 1,
      nextAttemptAt: expect.any(String),
      lastError: "network timeout while writing tombstone",
    });
    const retryDelayMs =
      Date.parse(retryEntry?.nextAttemptAt ?? "") - Date.parse(deletedAt);
    expect(retryDelayMs).toBeGreaterThanOrEqual(4_000);
    expect(retryDelayMs).toBeLessThanOrEqual(6_000);
  });
});
