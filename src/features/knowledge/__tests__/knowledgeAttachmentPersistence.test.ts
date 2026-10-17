import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createAttachmentForFile } from "@/features/attachments";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

describe("Knowledge attachments through the existing storage adapter", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await destroyTestDatabase(database);
  });

  it("retains owner metadata and file content after reopening the database", async () => {
    const owner = await storage.knowledge.create({ title: "Owner", type: "note", content: "Note" });
    const other = await storage.knowledge.create({ title: "Other", type: "note", content: "Note" });
    const file = new File(["Saved knowledge attachment"], "note.txt", { type: "text/plain" });
    const attachment = await createAttachmentForFile(
      { ownerType: "knowledge", ownerId: owner.id, file },
      { attachments: storage.attachments, binaryStorage: storage.attachmentBinary }
    );

    database.close();
    await database.open();

    expect(await storage.attachments.listByOwner("knowledge", owner.id)).toEqual([attachment]);
    expect(await storage.attachments.listByOwner("knowledge", other.id)).toEqual([]);
    expect(await storage.attachmentBinary.has(attachment.storageKey)).toBe(true);
    expect(await (await storage.attachmentBinary.retrieve(attachment.storageKey))?.text())
      .toBe("Saved knowledge attachment");
  });

  it("removes newly created metadata if saving its binary content fails", async () => {
    const owner = await storage.knowledge.create({ title: "Owner", type: "note", content: "Note" });
    vi.spyOn(storage.attachmentBinary, "save").mockRejectedValueOnce(new Error("Quota exceeded"));
    await expect(createAttachmentForFile(
      { ownerType: "knowledge", ownerId: owner.id, file: new File(["Note"], "note.txt") },
      { attachments: storage.attachments, binaryStorage: storage.attachmentBinary }
    )).rejects.toThrow("Quota exceeded");
    expect(await storage.attachments.listByOwner("knowledge", owner.id)).toEqual([]);
    expect(await storage.attachmentBinary.listKeys()).toEqual([]);
  });
});
