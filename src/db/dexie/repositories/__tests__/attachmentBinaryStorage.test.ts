import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

describe("Dexie attachment binary storage", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
  });

  it("saves, retrieves, replaces, and deletes binary content by storage key", async () => {
    const storageKey = "resource-1/book.pdf";
    const firstValue = new Blob(["first"], { type: "application/pdf" });
    const replacementValue = new Blob(["replacement"], {
      type: "application/pdf",
    });

    await storage.attachmentBinary.save(storageKey, firstValue);
    expect(await storage.attachmentBinary.has(storageKey)).toBe(true);
    expect(await (await storage.attachmentBinary.retrieve(storageKey))?.text()).toBe(
      "first"
    );

    await storage.attachmentBinary.save(storageKey, replacementValue);
    const retrieved = await storage.attachmentBinary.retrieve(storageKey);
    expect(retrieved?.type).toBe("application/pdf");
    expect(await retrieved?.text()).toBe("replacement");

    await storage.attachmentBinary.delete(storageKey);

    expect(await storage.attachmentBinary.retrieve(storageKey)).toBeUndefined();
    expect(await storage.attachmentBinary.has(storageKey)).toBe(false);
    expect(await storage.attachmentBinary.listKeys()).toEqual([]);
  });

  it("lists every stored binary key without reading binary content", async () => {
    await storage.attachmentBinary.save(
      "attachments/one",
      new Blob(["one"], { type: "text/plain" })
    );
    await storage.attachmentBinary.save(
      "attachments/two",
      new Blob(["two"], { type: "text/plain" })
    );

    await expect(storage.attachmentBinary.listKeys()).resolves.toEqual(
      expect.arrayContaining(["attachments/one", "attachments/two"])
    );
  });
});
