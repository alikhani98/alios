import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { taskInput } from "@/test/factories";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

describe("Dexie mutation outbox", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
  });

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
});
