import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MutationOutboxEntity } from "@/core/sync";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import {
  financeObligationInput,
  financeTransactionInput,
  goalInput,
  manualEntryInput,
  projectInput,
  routineInput,
  taskInput,
} from "@/test/factories";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

type MatrixRecord = Readonly<{ id: string }>;

type CaptureMatrixCase = Readonly<{
  entity: MutationOutboxEntity;
  create: () => Promise<MatrixRecord>;
  update: (id: string) => Promise<MatrixRecord>;
  delete: (id: string) => Promise<void>;
  getById: (id: string) => Promise<MatrixRecord | undefined>;
  list: () => Promise<MatrixRecord[]>;
  errorMessages: Readonly<{
    create: string;
    update: string;
    delete: string;
  }>;
}>;

describe("Dexie mutation outbox", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await destroyTestDatabase(database);
  });

  function captureMatrixCases(): CaptureMatrixCase[] {
    return [
      {
        entity: "tasks",
        create: () => storage.tasks.create(taskInput),
        update: (id) => storage.tasks.update(id, { title: "Updated task" }),
        delete: (id) => storage.tasks.delete(id),
        getById: (id) => storage.tasks.getById(id),
        list: () => storage.tasks.list(),
        errorMessages: {
          create: "Failed while creating a task.",
          update: "Failed while updating a task.",
          delete: "Failed while deleting a task.",
        },
      },
      {
        entity: "routines",
        create: () => storage.routines.create(routineInput),
        update: (id) =>
          storage.routines.update(id, { title: "Updated routine" }),
        delete: (id) => storage.routines.delete(id),
        getById: async (id) =>
          (await storage.routines.list()).find((record) => record.id === id),
        list: () => storage.routines.list(),
        errorMessages: {
          create: "Failed while creating a routine.",
          update: "Failed while updating a routine.",
          delete: "Failed while deleting a routine.",
        },
      },
      {
        entity: "projects",
        create: () => storage.projects.create(projectInput),
        update: (id) =>
          storage.projects.update(id, { title: "Updated project" }),
        delete: (id) => storage.projects.delete(id),
        getById: (id) => storage.projects.getById(id),
        list: () => storage.projects.list(),
        errorMessages: {
          create: "Failed while creating a project.",
          update: "Failed while updating a project.",
          delete: "Failed while deleting a project.",
        },
      },
      {
        entity: "goals",
        create: () => storage.goals.create(goalInput),
        update: (id) => storage.goals.update(id, { title: "Updated goal" }),
        delete: (id) => storage.goals.delete(id),
        getById: (id) => storage.goals.getById(id),
        list: () => storage.goals.list(),
        errorMessages: {
          create: "Failed while creating a goal.",
          update: "Failed while updating a goal.",
          delete: "Failed while deleting a goal.",
        },
      },
      {
        entity: "financeTransactions",
        create: () => storage.finance.createTransaction(financeTransactionInput),
        update: (id) =>
          storage.finance.updateTransaction(id, {
            title: "Updated transaction",
          }),
        delete: (id) => storage.finance.deleteTransaction(id),
        getById: (id) => storage.finance.getTransactionById(id),
        list: () => storage.finance.listTransactions(),
        errorMessages: {
          create: "Failed while creating a finance transaction.",
          update: "Failed while updating a finance transaction.",
          delete: "Failed while deleting a finance transaction.",
        },
      },
      {
        entity: "financeObligations",
        create: () => storage.finance.createObligation(financeObligationInput),
        update: (id) =>
          storage.finance.updateObligation(id, {
            title: "Updated obligation",
          }),
        delete: (id) => storage.finance.deleteObligation(id),
        getById: (id) => storage.finance.getObligationById(id),
        list: () => storage.finance.listObligations(),
        errorMessages: {
          create: "Failed while creating a finance obligation.",
          update: "Failed while updating a finance obligation.",
          delete: "Failed while deleting a finance obligation.",
        },
      },
      {
        entity: "manualEntries",
        create: () => storage.manual.create(manualEntryInput),
        update: (id) =>
          storage.manual.update(id, { title: "Updated manual entry" }),
        delete: (id) => storage.manual.delete(id),
        getById: (id) => storage.manual.getById(id),
        list: () => storage.manual.list(),
        errorMessages: {
          create: "Failed while creating a manual entry.",
          update: "Failed while updating a manual entry.",
          delete: "Failed while deleting a manual entry.",
        },
      },
    ];
  }

  async function expectWrappedOutboxFailure(
    action: () => Promise<unknown>,
    expectedMessage: string
  ) {
    let caughtError: unknown;

    try {
      await action();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe(expectedMessage);
    const cause = (caughtError as { cause?: unknown }).cause;
    expect(cause).toBeInstanceOf(Error);
    expect((cause as Error).message).toBe("outbox unavailable");
  }

  it("rolls back the local write when the outbox insert fails", async () => {
    vi.spyOn(database.mutationOutbox, "add").mockRejectedValue(
      new Error("outbox unavailable")
    );

    await expect(storage.tasks.create(taskInput)).rejects.toThrow();
    expect(await storage.tasks.list()).toEqual([]);
    expect(await storage.mutationOutbox.list()).toEqual([]);
  });

  it("recovers a processing entry after the lease expires", async () => {
    const entry = await storage.mutationOutbox.enqueue({
      entity: "tasks",
      operation: "update",
      recordId: "task-1",
      payload: { id: "task-1" },
    });

    await database.mutationOutbox.update(entry.id, {
      status: "processing",
      processingStartedAt: "2026-09-26T09:58:00.000Z",
      lastAttemptAt: "2026-09-26T09:58:00.000Z",
      attemptCount: 1,
    });

    const recovered = await storage.mutationOutbox.recoverExpiredProcessing(
      "2026-09-26T10:00:01.000Z",
      2 * 60 * 1000
    );

    expect(recovered).toBe(1);
    await expect(storage.mutationOutbox.getById(entry.id)).resolves.toMatchObject({
      status: "pending",
      processingStartedAt: undefined,
      nextAttemptAt: undefined,
    });
  });

  it("clears outbox entries with clearAll and restore replacement", async () => {
    await storage.mutationOutbox.enqueue({
      entity: "tasks",
      operation: "update",
      recordId: "task-clear",
      payload: { id: "task-clear" },
    });
    await storage.backup.clearAll();
    expect(await storage.mutationOutbox.list()).toEqual([]);

    await storage.mutationOutbox.enqueue({
      entity: "tasks",
      operation: "update",
      recordId: "task-restore",
      payload: { id: "task-restore" },
    });
    const backup = await storage.backup.readAll();
    await storage.backup.replaceAll(backup, {
      preserveMutationOutbox: true,
    });
    expect(await storage.mutationOutbox.list()).toHaveLength(1);

    await storage.backup.replaceAll(backup);
    expect(await storage.mutationOutbox.list()).toEqual([]);
  });

  it("captures create, update, and delete mutations for every synced entity", async () => {
    for (const testCase of captureMatrixCases()) {
      await database.mutationOutbox.clear();

      const created = await testCase.create();
      await expect(storage.mutationOutbox.list()).resolves.toEqual([
        expect.objectContaining({
          entity: testCase.entity,
          operation: "create",
          recordId: created.id,
          payload: expect.objectContaining({ id: created.id }),
          status: "pending",
          attemptCount: 0,
        }),
      ]);

      await testCase.update(created.id);
      const afterUpdate = await storage.mutationOutbox.list();
      expect(afterUpdate).toHaveLength(2);
      expect(afterUpdate).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ operation: "create" }),
          expect.objectContaining({
            entity: testCase.entity,
            operation: "update",
            recordId: created.id,
            payload: expect.objectContaining({ id: created.id }),
          }),
        ])
      );

      await testCase.delete(created.id);
      const afterDelete = await storage.mutationOutbox.list();
      expect(afterDelete).toHaveLength(3);
      expect(afterDelete).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ operation: "create" }),
          expect.objectContaining({ operation: "update" }),
          expect.objectContaining({
            entity: testCase.entity,
            operation: "delete",
            recordId: created.id,
            payload: expect.objectContaining({ id: created.id }),
            deletedAt: expect.any(String),
          }),
        ])
      );
    }
  });

  it("keeps each synced entity mutation atomic when outbox enqueue fails", async () => {
    for (const testCase of captureMatrixCases()) {
      await database.mutationOutbox.clear();

      const beforeCreate = await testCase.list();
      vi.spyOn(database.mutationOutbox, "add").mockRejectedValueOnce(
        new Error("outbox unavailable")
      );
      await expectWrappedOutboxFailure(
        () => testCase.create(),
        testCase.errorMessages.create
      );
      await expect(testCase.list()).resolves.toEqual(beforeCreate);
      await expect(storage.mutationOutbox.list()).resolves.toEqual([]);

      const created = await testCase.create();
      await database.mutationOutbox.clear();

      const beforeUpdate = await testCase.getById(created.id);
      vi.spyOn(database.mutationOutbox, "add").mockRejectedValueOnce(
        new Error("outbox unavailable")
      );
      await expectWrappedOutboxFailure(
        () => testCase.update(created.id),
        testCase.errorMessages.update
      );
      await expect(testCase.getById(created.id)).resolves.toEqual(beforeUpdate);
      await expect(storage.mutationOutbox.list()).resolves.toEqual([]);

      vi.spyOn(database.mutationOutbox, "add").mockRejectedValueOnce(
        new Error("outbox unavailable")
      );
      await expectWrappedOutboxFailure(
        () => testCase.delete(created.id),
        testCase.errorMessages.delete
      );
      await expect(testCase.getById(created.id)).resolves.toEqual(beforeUpdate);
      await expect(storage.mutationOutbox.list()).resolves.toEqual([]);

      await testCase.delete(created.id);
    }
  });

  it("does not let two concurrent workers claim the same ready entry", async () => {
    const entry = await storage.mutationOutbox.enqueue({
      entity: "tasks",
      operation: "update",
      recordId: "task-claim",
      payload: { id: "task-claim" },
    });

    const claims = await Promise.all([
      storage.mutationOutbox.claim(
        entry.id,
        "2026-09-26T10:00:00.000Z",
        2 * 60 * 1000
      ),
      storage.mutationOutbox.claim(
        entry.id,
        "2026-09-26T10:00:00.000Z",
        2 * 60 * 1000
      ),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    await expect(storage.mutationOutbox.getById(entry.id)).resolves.toMatchObject({
      status: "processing",
      attemptCount: 1,
      processingStartedAt: "2026-09-26T10:00:00.000Z",
    });
  });
});
