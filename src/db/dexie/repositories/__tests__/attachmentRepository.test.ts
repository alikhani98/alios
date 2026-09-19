import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

describe("Dexie attachment foundation", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
  });

  it("creates, reads, filters, and deletes attachment metadata", async () => {
    const resourceAttachment = await storage.attachments.create({
      ownerType: "resource",
      ownerId: "resource-1",
      kind: "document",
      filename: "book.pdf",
      mimeType: "application/pdf",
      size: 128,
      storageKey: "resource-1/book.pdf",
      checksum: "checksum-1",
    });
    const knowledgeAttachment = await storage.attachments.create({
      ownerType: "knowledge",
      ownerId: "knowledge-1",
      kind: "image",
      filename: "diagram.png",
      mimeType: "image/png",
      size: 64,
      storageKey: "knowledge-1/diagram.png",
    });

    expect(await storage.attachments.getById(resourceAttachment.id)).toEqual(
      resourceAttachment
    );
    expect(
      await storage.attachments.listByOwner("resource", "resource-1")
    ).toEqual([resourceAttachment]);
    expect(
      await storage.attachments.listByOwner("knowledge", "knowledge-1")
    ).toEqual([knowledgeAttachment]);
    expect(
      await storage.attachments.listByOwner("resource", "missing-owner")
    ).toEqual([]);

    await storage.attachments.delete(resourceAttachment.id);

    expect(await storage.attachments.getById(resourceAttachment.id)).toBeUndefined();
  });
});
