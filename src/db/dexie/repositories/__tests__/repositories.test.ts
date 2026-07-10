import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ValidationError } from "@/core/errors";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import {
  dailyCheckinInput,
  decisionLogInput,
  financeObligationInput,
  financeTransactionInput,
  journalEntryInput,
  inboxItemInput,
  knowledgeItemInput,
  manualEntryInput,
  projectInput,
  settingInput,
  taskInput,
} from "@/test/factories";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

describe("Dexie repositories", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
  });

  it("supports the complete Projects CRUD lifecycle", async () => {
    const created = await storage.projects.create(projectInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
    expect(await storage.projects.list()).toEqual([created]);
    expect(await storage.projects.getById(created.id)).toEqual(created);

    const updated = await storage.projects.update(created.id, {
      title: "Ship tested AliOS",
    });
    expect(updated.title).toBe("Ship tested AliOS");
    expect((await storage.projects.getById(created.id))?.title).toBe(
      "Ship tested AliOS"
    );

    await storage.projects.delete(created.id);
    expect(await storage.projects.list()).toEqual([]);
    expect(await storage.projects.getById(created.id)).toBeUndefined();
  });

  it("supports the complete Tasks CRUD lifecycle", async () => {
    const created = await storage.tasks.create(taskInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.tasks.list()).toEqual([created]);
    expect(await storage.tasks.getById(created.id)).toEqual(created);

    const updated = await storage.tasks.update(created.id, {
      status: "done",
      completedAt: "2026-07-05T09:00:00.000Z",
    });
    expect(updated.status).toBe("done");
    expect((await storage.tasks.getById(created.id))?.completedAt).toBe(
      "2026-07-05T09:00:00.000Z"
    );

    await storage.tasks.delete(created.id);
    expect(await storage.tasks.list()).toEqual([]);
    expect(await storage.tasks.getById(created.id)).toBeUndefined();
  });

  it("supports the complete Journal CRUD lifecycle", async () => {
    const created = await storage.journal.create(journalEntryInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.journal.list()).toEqual([created]);
    expect(await storage.journal.getById(created.id)).toEqual(created);

    const updated = await storage.journal.update(created.id, {
      content: "Updated reflection.",
    });
    expect(updated.content).toBe("Updated reflection.");
    expect((await storage.journal.getById(created.id))?.content).toBe(
      "Updated reflection."
    );

    await storage.journal.delete(created.id);
    expect(await storage.journal.list()).toEqual([]);
    expect(await storage.journal.getById(created.id)).toBeUndefined();
  });

  it("supports the complete Knowledge CRUD lifecycle", async () => {
    const created = await storage.knowledge.create(knowledgeItemInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.knowledge.list()).toEqual([created]);
    expect(await storage.knowledge.getById(created.id)).toEqual(created);

    const updated = await storage.knowledge.update(created.id, {
      summary: "Updated testing rule.",
    });
    expect(updated.summary).toBe("Updated testing rule.");
    expect((await storage.knowledge.getById(created.id))?.summary).toBe(
      "Updated testing rule."
    );

    await storage.knowledge.delete(created.id);
    expect(await storage.knowledge.list()).toEqual([]);
    expect(await storage.knowledge.getById(created.id)).toBeUndefined();
  });

  it("supports the complete Daily Check-ins CRUD lifecycle", async () => {
    const created = await storage.dailyCheckins.create(dailyCheckinInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.dailyCheckins.list()).toEqual([created]);
    expect(await storage.dailyCheckins.getByDate(created.date)).toEqual(created);

    const updated = await storage.dailyCheckins.update(created.id, {
      notes: "Updated check-in.",
    });
    expect(updated.notes).toBe("Updated check-in.");
    expect((await storage.dailyCheckins.getByDate(created.date))?.notes).toBe(
      "Updated check-in."
    );

    await storage.dailyCheckins.delete(created.id);
    expect(await storage.dailyCheckins.list()).toEqual([]);
    expect(await storage.dailyCheckins.getByDate(created.date)).toBeUndefined();
  });

  it("supports the complete Settings CRUD lifecycle", async () => {
    const created = await storage.settings.create(settingInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.settings.list()).toEqual([created]);
    expect(await storage.settings.getByKey(created.key)).toEqual(created);

    const updated = await storage.settings.update(created.id, { value: false });
    expect(updated.value).toBe(false);
    expect((await storage.settings.getByKey(created.key))?.value).toBe(false);

    await storage.settings.delete(created.id);
    expect(await storage.settings.list()).toEqual([]);
    expect(await storage.settings.getByKey(created.key)).toBeUndefined();
  });

  it("supports the complete Finance transaction CRUD lifecycle", async () => {
    const created = await storage.finance.createTransaction(financeTransactionInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.finance.listTransactions()).toEqual([created]);
    expect(await storage.finance.getTransactionById(created.id)).toEqual(created);

    const updated = await storage.finance.updateTransaction(created.id, {
      title: "Updated salary",
    });
    expect(updated.title).toBe("Updated salary");
    expect((await storage.finance.getTransactionById(created.id))?.title).toBe(
      "Updated salary"
    );

    await storage.finance.deleteTransaction(created.id);
    expect(await storage.finance.listTransactions()).toEqual([]);
    expect(await storage.finance.getTransactionById(created.id)).toBeUndefined();
  });

  it("supports the complete Finance obligation CRUD lifecycle", async () => {
    const created = await storage.finance.createObligation(financeObligationInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.finance.listObligations()).toEqual([created]);
    expect(await storage.finance.getObligationById(created.id)).toEqual(created);

    const updated = await storage.finance.updateObligation(created.id, {
      paidAmount: 1000,
      status: "paused",
    });
    expect(updated.paidAmount).toBe(1000);
    expect(updated.status).toBe("paused");
    expect((await storage.finance.getObligationById(created.id))?.paidAmount).toBe(
      1000
    );

    await storage.finance.deleteObligation(created.id);
    expect(await storage.finance.listObligations()).toEqual([]);
    expect(await storage.finance.getObligationById(created.id)).toBeUndefined();
  });

  it("supports the complete Decision Log CRUD lifecycle", async () => {
    const created = await storage.decisions.create(decisionLogInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.decisions.list()).toEqual([created]);

    const updated = await storage.decisions.update(created.id, {
      status: "reviewed",
      actualOutcome: "It worked well.",
      lesson: "Keep the page calm.",
    });
    expect(updated.status).toBe("reviewed");
    expect(updated.actualOutcome).toBe("It worked well.");

    await storage.decisions.delete(created.id);
    expect(await storage.decisions.list()).toEqual([]);
  });

  it("supports the complete Personal Manual CRUD lifecycle", async () => {
    const created = await storage.manual.create(manualEntryInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await storage.manual.list()).toEqual([created]);
    expect(await storage.manual.getById(created.id)).toEqual(created);

    const updated = await storage.manual.update(created.id, {
      title: "Updated planning rule",
      lastReviewedAt: "2026-07-06T08:30:00.000Z",
    });
    expect(updated.title).toBe("Updated planning rule");
    expect(updated.lastReviewedAt).toBe("2026-07-06T08:30:00.000Z");

    await storage.manual.delete(created.id);
    expect(await storage.manual.list()).toEqual([]);
    expect(await storage.manual.getById(created.id)).toBeUndefined();
  });

  it("supports the complete Inbox CRUD and status lifecycle", async () => {
    const created = await storage.inbox.create(inboxItemInput);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created.status).toBe("unprocessed");
    expect(await storage.inbox.list()).toEqual([created]);
    expect(await storage.inbox.getById(created.id)).toEqual(created);

    const edited = await storage.inbox.update(created.id, {
      content: "Updated captured idea",
      type: "note",
    });
    expect(edited.content).toBe("Updated captured idea");
    expect(edited.type).toBe("note");

    const processed = await storage.inbox.update(created.id, {
      status: "processed",
    });
    expect(processed.status).toBe("processed");

    const unprocessed = await storage.inbox.update(created.id, {
      status: "unprocessed",
    });
    expect(unprocessed.status).toBe("unprocessed");

    await storage.inbox.delete(created.id);
    expect(await storage.inbox.list()).toEqual([]);
    expect(await storage.inbox.getById(created.id)).toBeUndefined();
  });

  it("translates invalid repository input into a project ValidationError", async () => {
    await expect(
      storage.projects.create({ ...projectInput, title: " " })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
