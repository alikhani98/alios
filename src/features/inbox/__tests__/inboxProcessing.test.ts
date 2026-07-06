import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import {
  deleteInboxItems,
  processInboxItem,
  setInboxItemProcessed,
  setInboxItemsProcessed,
} from "../inboxProcessing";

describe("Inbox processing", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
  });

  it("converts an Inbox item to a Today task and keeps the processed original", async () => {
    const inboxItem = await storage.inbox.create({
      content: "Call the dentist about the next appointment",
      type: "task",
    });

    await processInboxItem(storage, inboxItem.id, "todayTask", "2026-07-05");

    const [task] = await storage.tasks.list();
    expect(task).toMatchObject({
      title: inboxItem.content,
      status: "todo",
      priority: "medium",
      dueDate: "2026-07-05",
      isMit: false,
    });
    expect(await storage.inbox.getById(inboxItem.id)).toMatchObject({
      content: inboxItem.content,
      status: "processed",
    });
  });

  it("converts an Inbox item to a Journal entry", async () => {
    const inboxItem = await storage.inbox.create({
      content: "A useful reflection captured for the daily journal.",
      type: "note",
    });

    await processInboxItem(storage, inboxItem.id, "journalEntry", "2026-07-05");

    expect(await storage.journal.list()).toEqual([
      expect.objectContaining({
        date: "2026-07-05",
        type: "daily",
        title: inboxItem.content,
        content: inboxItem.content,
      }),
    ]);
    expect((await storage.inbox.getById(inboxItem.id))?.status).toBe("processed");
  });

  it("converts a link Inbox item to a Knowledge resource", async () => {
    const inboxItem = await storage.inbox.create({
      content: "https://example.com/a-useful-reference",
      type: "link",
    });

    await processInboxItem(storage, inboxItem.id, "knowledgeItem", "2026-07-05");

    expect(await storage.knowledge.list()).toEqual([
      expect.objectContaining({
        title: inboxItem.content,
        type: "resource",
        content: inboxItem.content,
        source: inboxItem.content,
      }),
    ]);
    expect((await storage.inbox.getById(inboxItem.id))?.status).toBe("processed");
  });

  it("does not mark the Inbox item processed when target creation fails", async () => {
    const inboxItem = await storage.inbox.create({ content: "Keep me pending", type: "task" });
    vi.spyOn(storage.tasks, "create").mockRejectedValueOnce(new Error("create failed"));

    await expect(
      processInboxItem(storage, inboxItem.id, "todayTask", "2026-07-05")
    ).rejects.toThrow("create failed");

    expect((await storage.inbox.getById(inboxItem.id))?.status).toBe("unprocessed");
    expect(await storage.tasks.list()).toEqual([]);
  });

  it("marks Inbox items processed and unprocessed without deleting them", async () => {
    const inboxItem = await storage.inbox.create({ content: "Retain this item", type: "other" });

    expect((await setInboxItemProcessed(storage, inboxItem.id, true)).status).toBe("processed");
    expect((await setInboxItemProcessed(storage, inboxItem.id, false)).status).toBe("unprocessed");
    expect(await storage.inbox.getById(inboxItem.id)).toBeDefined();
  });

  it("bulk marks only selected Inbox items processed", async () => {
    const first = await storage.inbox.create({ content: "First selected", type: "note" });
    const second = await storage.inbox.create({ content: "Second selected", type: "task" });
    const untouched = await storage.inbox.create({ content: "Do not touch", type: "idea" });

    await setInboxItemsProcessed(storage, [first.id, second.id], true);

    expect((await storage.inbox.getById(first.id))?.status).toBe("processed");
    expect((await storage.inbox.getById(second.id))?.status).toBe("processed");
    expect((await storage.inbox.getById(untouched.id))?.status).toBe("unprocessed");
  });

  it("bulk marks only selected Inbox items unprocessed", async () => {
    const first = await storage.inbox.create({
      content: "First selected",
      type: "note",
      status: "processed",
    });
    const second = await storage.inbox.create({
      content: "Second selected",
      type: "task",
      status: "processed",
    });
    const untouched = await storage.inbox.create({
      content: "Do not touch",
      type: "idea",
      status: "processed",
    });

    await setInboxItemsProcessed(storage, [first.id, second.id], false);

    expect((await storage.inbox.getById(first.id))?.status).toBe("unprocessed");
    expect((await storage.inbox.getById(second.id))?.status).toBe("unprocessed");
    expect((await storage.inbox.getById(untouched.id))?.status).toBe("processed");
  });

  it("bulk deletes only selected Inbox items", async () => {
    const first = await storage.inbox.create({ content: "Delete one", type: "note" });
    const second = await storage.inbox.create({ content: "Delete two", type: "task" });
    const untouched = await storage.inbox.create({ content: "Keep this", type: "idea" });

    await deleteInboxItems(storage, [first.id, second.id]);

    expect(await storage.inbox.getById(first.id)).toBeUndefined();
    expect(await storage.inbox.getById(second.id)).toBeUndefined();
    expect(await storage.inbox.getById(untouched.id)).toBeDefined();
  });
});
