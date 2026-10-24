import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import type { Attachment } from "@/shared/types";
import {
  AttachmentPackageConflictError,
  type AttachmentPackageImportData,
} from "@/core/repositories/attachmentPackageImport";
import { importAttachmentPackage, exportAttachmentPackage } from "@/features/attachments/attachmentPackage";
import { getAttachmentBinary } from "@/features/attachments/attachmentAccess";

const bytes = (text: string) => new TextEncoder().encode(text);
const attachment = (id: string, storageKey = `attachments/${id}`, size = bytes(id).byteLength): Attachment => ({
  id, storageKey, ownerType: "resource", ownerId: "synthetic-resource",
  kind: "document", filename: `${id}.txt`, mimeType: "text/plain", size,
  createdAt: "2026-10-24T08:00:00.000Z", updatedAt: "2026-10-24T08:00:00.000Z",
});
const candidate = (): AttachmentPackageImportData => ({
  attachments: [attachment("one"), attachment("two"), attachment("three")],
  binaries: ["one", "two", "three"].map((id) => ({ storageKey: `attachments/${id}`, bytes: bytes(id) })),
});

describe("atomic attachment package import", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  let peerDatabase: AliosDatabase;
  let peer: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    peerDatabase = new AliosDatabase();
    await peerDatabase.open();
    peer = new DexieStorageAdapter(peerDatabase);
    await database.attachments.bulkAdd([
      attachment("existing-resource", "attachments/shared", 9),
      { ...attachment("existing-knowledge", "attachments/shared", 9), ownerType: "knowledge" },
    ]);
    await storage.attachmentBinary.save("attachments/shared", new Blob(["preserved"]));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    peerDatabase.close();
    await destroyTestDatabase(database);
  });

  async function state(db = peerDatabase) {
    const snapshot = await db.transaction("r", db.attachments, db.attachmentBlobs, async () => ({
      metadata: await db.attachments.toArray(), binaries: await db.attachmentBlobs.toArray(),
    }));
    return {
      metadata: snapshot.metadata,
      binaries: await Promise.all(snapshot.binaries.map(async (binary) => ({
        storageKey: binary.storageKey, content: Array.from(new Uint8Array(await binary.blob.arrayBuffer())),
      }))),
    };
  }

  for (const store of ["attachmentBlobs", "attachments"] as const) {
    it.each([1, 2, 3])(`aborts all changes on ${store} write failure at position %i and permits retry`, async (position) => {
      const baseline = await state();
      let writes = 0;
      let observer: ReturnType<typeof state> | undefined;
      const fail = () => {
        if (++writes !== position) return;
        // A different connection must see only committed state, even mid-import.
        observer = Dexie.ignoreTransaction(() => state());
        throw new Error(`synthetic ${store} failure`);
      };
      const table = database[store];
      table.hook("creating", fail);
      try {
        await expect(storage.attachments.importPackage(candidate())).rejects.toThrow();
      } finally {
        table.hook("creating").unsubscribe(fail);
      }
      expect(writes).toBe(position);
      expect(observer).toBeDefined();
      expect(await observer).toEqual(baseline);
      expect(await state()).toEqual(baseline);
      const result = await storage.attachments.importPackage(candidate());
      expect(result).toEqual({ importedMetadataCount: 3, importedBinaryCount: 3,
        reusedMetadataCount: 0, reusedBinaryCount: 0 });
      expect((await state()).metadata).toHaveLength(baseline.metadata.length + 3);
      expect(await (await peer.attachmentBinary.retrieve("attachments/shared"))?.text()).toBe("preserved");
    });
  }

  it("reuses identical metadata and shared binaries without writing them again", async () => {
    await storage.attachments.importPackage(candidate());
    const baseline = await state();
    const addMetadata = vi.spyOn(database.attachments, "add");
    const addBinary = vi.spyOn(database.attachmentBlobs, "add");
    const result = await storage.attachments.importPackage(candidate());
    expect(result).toEqual({ importedMetadataCount: 0, importedBinaryCount: 0,
      reusedMetadataCount: 3, reusedBinaryCount: 3 });
    expect(addMetadata).not.toHaveBeenCalled();
    expect(addBinary).not.toHaveBeenCalled();
    expect(await state()).toEqual(baseline);
  });

  it("rejects different bytes of the same size under an existing storage key", async () => {
    await storage.attachments.importPackage(candidate());
    const baseline = await state();
    const data = candidate();
    data.binaries[0].bytes.set(bytes("ONE"));
    await expect(storage.attachments.importPackage(data)).rejects.toBeInstanceOf(AttachmentPackageConflictError);
    expect(await state()).toEqual(baseline);
  });

  it("aborts when the protected existing Blob read rejects", async () => {
    const baseline = await state();
    const read = vi.spyOn(Blob.prototype, "arrayBuffer").mockRejectedValueOnce(new Error("synthetic Blob failure"));
    await expect(storage.attachments.importPackage({
      attachments: [attachment("adopter", "attachments/shared", 9)],
      binaries: [{ storageKey: "attachments/shared", bytes: bytes("preserved") }],
    })).rejects.toThrow();
    read.mockRestore();
    expect(await state()).toEqual(baseline);
  });

  it("lets a second connection observe the whole committed import, never its partial writes", async () => {
    let observer: ReturnType<typeof state> | undefined;
    const observe = () => {
      observer ??= Dexie.ignoreTransaction(() => state());
    };
    database.attachmentBlobs.hook("creating", observe);
    try {
      await storage.attachments.importPackage(candidate());
    } finally {
      database.attachmentBlobs.hook("creating").unsubscribe(observe);
    }
    expect(observer).toBeDefined();
    expect(await observer).toEqual(await state());
    expect((await observer)?.metadata).toHaveLength(5);
    expect((await observer)?.binaries).toHaveLength(4);
  });

  it("serializes simultaneous identical imports and reuses the first commit", async () => {
    const results = await Promise.all([
      storage.attachments.importPackage(candidate()), peer.attachments.importPackage(candidate()),
    ]);
    expect(results.map((result) => result.importedMetadataCount).sort()).toEqual([0, 3]);
    expect(results.map((result) => result.importedBinaryCount).sort()).toEqual([0, 3]);
    expect((await state()).metadata).toHaveLength(5);
  });

  it("rejects one conflicting concurrent import without mixing their contents", async () => {
    const competing = candidate();
    competing.binaries[0].bytes.set(bytes("ONE"));
    const results = await Promise.allSettled([
      storage.attachments.importPackage(candidate()), peer.attachments.importPackage(competing),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect((await state()).metadata).toHaveLength(5);
    expect((await state()).binaries).toHaveLength(4);
  });

  it("revalidates metadata created by another connection after feature preflight", async () => {
    await storage.attachments.importPackage(candidate());
    const exported = await exportAttachmentPackage({ attachments: storage.attachments, binaryStorage: storage.attachmentBinary });
    await storage.attachments.delete("one", { deleteUnreferencedBinary: true });
    const original = storage.attachments.importPackage.bind(storage.attachments);
    vi.spyOn(storage.attachments, "importPackage").mockImplementationOnce(async (data) => {
      await peerDatabase.attachments.add({ ...attachment("one"), filename: "concurrent.txt" });
      return original(data);
    });
    const baseline = await state();
    await expect(importAttachmentPackage({ manifestFile: exported.manifestBlob, bundleFile: exported.bundleBlob },
      { attachments: storage.attachments, binaryStorage: storage.attachmentBinary }
    )).rejects.toBeInstanceOf(AttachmentPackageConflictError);
    const after = await state();
    expect(after.binaries).toEqual(baseline.binaries);
    expect(after.metadata).toEqual([...baseline.metadata, { ...attachment("one"), filename: "concurrent.txt" }]
      .sort((left, right) => left.id.localeCompare(right.id)));
  });

  it("rejects a storage-key collision introduced after feature preflight", async () => {
    await storage.attachments.importPackage(candidate());
    const exported = await exportAttachmentPackage({ attachments: storage.attachments, binaryStorage: storage.attachmentBinary });
    await storage.attachments.delete("one", { deleteUnreferencedBinary: true });
    const original = storage.attachments.importPackage.bind(storage.attachments);
    vi.spyOn(storage.attachments, "importPackage").mockImplementationOnce(async (data) => {
      await peer.attachmentBinary.save("attachments/one", new Blob(["ONE"]));
      return original(data);
    });
    const baseline = await state();
    await expect(importAttachmentPackage({ manifestFile: exported.manifestBlob, bundleFile: exported.bundleBlob },
      { attachments: storage.attachments, binaryStorage: storage.attachmentBinary }
    )).rejects.toBeInstanceOf(AttachmentPackageConflictError);
    expect((await state()).metadata).toEqual(baseline.metadata);
    expect(await peer.attachments.getById("one")).toBeUndefined();
    expect(await (await peer.attachmentBinary.retrieve("attachments/one"))?.text()).toBe("ONE");
    expect((await state()).binaries.filter((binary) => binary.storageKey !== "attachments/one")).toEqual(baseline.binaries);
  });

  it("protects imported shared references from a queued final-reference deletion", async () => {
    const original = attachment("sole-reference", "attachments/sole", 6);
    await database.attachments.add(original);
    await storage.attachmentBinary.save(original.storageKey, new Blob(["shared"]));
    let deletion: Promise<void> | undefined;
    const queueDeletion = () => {
      deletion = Dexie.ignoreTransaction(() => peer.attachments.delete(original.id, { deleteUnreferencedBinary: true }));
    };
    database.attachments.hook("creating", queueDeletion);
    try {
      await storage.attachments.importPackage({
        attachments: [attachment("new-reference", original.storageKey, 6)],
        binaries: [{ storageKey: original.storageKey, bytes: bytes("shared") }],
      });
    } finally {
      database.attachments.hook("creating").unsubscribe(queueDeletion);
    }
    expect(deletion).toBeDefined();
    await deletion;
    expect(await storage.attachments.getById(original.id)).toBeUndefined();
    const accessed = await getAttachmentBinary("new-reference", { attachments: storage.attachments, binaryStorage: storage.attachmentBinary });
    expect(await accessed?.blob.text()).toBe("shared");
  });

  it.each([0, 2, 4])("direct import rejects a declared size of %i for three bytes without changing either store", async (declaredSize) => {
    const baseline = await state();
    const data = candidate();
    data.attachments[0].size = declaredSize;
    const addMetadata = vi.spyOn(database.attachments, "add");
    const addBinary = vi.spyOn(database.attachmentBlobs, "add");
    await expect(storage.attachments.importPackage(data)).rejects.toMatchObject({
      conflicts: [{
        type: "metadata_binary_size_mismatch", attachmentId: "one", storageKey: "attachments/one",
        reason: `The metadata declares ${declaredSize} bytes, but its binary contains 3 bytes.`,
      }],
    });
    expect(addMetadata).not.toHaveBeenCalled();
    expect(addBinary).not.toHaveBeenCalled();
    expect(await state()).toEqual(baseline);
  });

  it("direct import checks all shared references and preserves existing shared bytes", async () => {
    const baseline = await state();
    await expect(storage.attachments.importPackage({
      attachments: [
        attachment("bad-small", "attachments/shared", 8),
        attachment("correct", "attachments/shared", 9),
        attachment("bad-large", "attachments/shared", 10),
      ],
      binaries: [{ storageKey: "attachments/shared", bytes: bytes("preserved") }],
    })).rejects.toMatchObject({
      conflicts: [
        expect.objectContaining({ type: "metadata_binary_size_mismatch", attachmentId: "bad-small", storageKey: "attachments/shared" }),
        expect.objectContaining({ type: "metadata_binary_size_mismatch", attachmentId: "bad-large", storageKey: "attachments/shared" }),
      ],
    });
    expect(await state()).toEqual(baseline);
  });

  it.each(["سلام🌱", ""])("direct import uses the byte length of a prepared view for %j", async (content) => {
    const view = bytes(`x${content}y`).subarray(1, -1);
    const record = attachment("byte-size", undefined, view.byteLength);
    await storage.attachments.importPackage({
      attachments: [record], binaries: [{ storageKey: record.storageKey, bytes: view }],
    });
    const accessed = await getAttachmentBinary(record.id, {
      attachments: peer.attachments, binaryStorage: peer.attachmentBinary,
    });
    expect(accessed?.attachment.size).toBe(view.byteLength);
    expect(accessed?.blob.size).toBe(view.byteLength);
    expect(await accessed?.blob.text()).toBe(content);
  });
});
