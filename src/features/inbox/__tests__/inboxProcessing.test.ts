import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { processInboxItem, setInboxItemProcessed } from "../inboxProcessing";

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
});
