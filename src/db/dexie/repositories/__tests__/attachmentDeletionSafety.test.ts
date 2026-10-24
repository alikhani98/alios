import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import type { CreateAttachmentInput } from "@/core/repositories";
import { createAttachmentForFile, deleteAttachment } from "@/features/attachments/attachmentWorkflow";
import { getAttachmentBinary } from "@/features/attachments/attachmentAccess";
import { exportAttachmentPackage, importAttachmentPackage } from "@/features/attachments/attachmentPackage";

const sharedKey = "attachments/shared-synthetic";
const contents = "synthetic attachment content";
const coordinated = { deleteUnreferencedBinary: true } as const;

function input(overrides: Partial<CreateAttachmentInput> = {}): CreateAttachmentInput {
  return {
    ownerType: "resource",
    ownerId: "resource-synthetic",
    kind: "document",
    filename: "synthetic.txt",
    mimeType: "text/plain",
    size: contents.length,
    storageKey: sharedKey,
    ...overrides,
  };
}

describe("attachment deletion storage coordination", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  let peerDatabase: AliosDatabase;
  let peer: DexieStorageAdapter;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    peerDatabase = new AliosDatabase();
    await peerDatabase.open();
    peer = new DexieStorageAdapter(peerDatabase);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    peerDatabase.close();
    await destroyTestDatabase(database);
  });

  const dependencies = () => ({
    attachments: storage.attachments,
    binaryStorage: storage.attachmentBinary,
  });

  async function seed() {
    const first = await storage.attachments.create(input());
    await storage.attachmentBinary.save(sharedKey, new Blob([contents]));
    return first;
  }

  it.each([
    { ownerType: "knowledge" as const, ownerId: "knowledge-synthetic" },
    { ownerType: "resource" as const, ownerId: "resource-synthetic" },
  ])("preserves shared content for a remaining $ownerType reference", async (owner) => {
    const first = await seed();
    const remaining = await storage.attachments.create(input(owner));

    await deleteAttachment(first.id, dependencies());

    expect(await storage.attachments.getById(first.id)).toBeUndefined();
    expect(await storage.attachments.getById(remaining.id)).toEqual(remaining);
    const accessed = await getAttachmentBinary(remaining.id, dependencies());
    expect(await accessed?.blob.text()).toBe(contents);
  });

  it("removes the last reference and binary, and repeated deletion is a no-op", async () => {
    const first = await seed();
    const second = await storage.attachments.create(input());
    await deleteAttachment(first.id, dependencies());
    await deleteAttachment(second.id, dependencies());
    await deleteAttachment(second.id, dependencies());
    expect(await storage.attachments.listAll()).toEqual([]);
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(false);
  });

  it("deletes missing-binary metadata and leaves unrelated binary content alone", async () => {
    const missing = await storage.attachments.create(input());
    await storage.attachmentBinary.save("attachments/unrelated", new Blob(["other"]));
    await deleteAttachment(missing.id, dependencies());
    expect(await storage.attachments.getById(missing.id)).toBeUndefined();
    expect(await storage.attachmentBinary.has("attachments/unrelated")).toBe(true);
  });

  it("rolls metadata deletion back when reference lookup fails", async () => {
    const attachment = await seed();
    vi.spyOn(database.attachments, "filter").mockImplementationOnce(() => {
      throw new Error("synthetic lookup failure");
    });
    await expect(deleteAttachment(attachment.id, dependencies())).rejects.toThrow();
    expect(await storage.attachments.getById(attachment.id)).toEqual(attachment);
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(true);
  });

  it("keeps metadata and all shared content when metadata deletion fails", async () => {
    const attachment = await seed();
    const remaining = await storage.attachments.create(input({ ownerType: "knowledge" }));
    vi.spyOn(database.attachments, "delete").mockRejectedValueOnce(new Error("synthetic metadata failure"));
    await expect(deleteAttachment(attachment.id, dependencies())).rejects.toThrow();
    expect(await storage.attachments.getById(attachment.id)).toEqual(attachment);
    expect(await getAttachmentBinary(remaining.id, dependencies())).toBeDefined();
  });

  it("rolls metadata deletion back when final binary deletion fails", async () => {
    const attachment = await seed();
    vi.spyOn(database.attachmentBlobs, "delete").mockRejectedValueOnce(new Error("synthetic binary failure"));
    await expect(deleteAttachment(attachment.id, dependencies())).rejects.toThrow();
    expect(await storage.attachments.getById(attachment.id)).toEqual(attachment);
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(true);
  });

  it("keeps metadata-only rollback distinct from ordinary deletion", async () => {
    const attachment = await seed();
    await storage.attachments.delete(attachment.id);
    expect(await storage.attachments.getById(attachment.id)).toBeUndefined();
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(true);
    await storage.attachmentBinary.delete(sharedKey);
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(false);
  });

  it("protects referenced content from direct binary cleanup", async () => {
    const attachment = await seed();
    await storage.attachmentBinary.delete(sharedKey);
    expect(await getAttachmentBinary(attachment.id, dependencies())).toBeDefined();
  });

  it("does not remove binary content if direct cleanup reference lookup fails", async () => {
    await seed();
    vi.spyOn(database.attachments, "filter").mockImplementationOnce(() => {
      throw new Error("synthetic lookup failure");
    });
    await expect(storage.attachmentBinary.delete(sharedKey)).rejects.toThrow();
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(true);
  });

  it("serializes binary cleanup behind a concurrent adopting reference", async () => {
    await storage.attachmentBinary.save(sharedKey, new Blob([contents]));
    let cleanup: Promise<void> | undefined;
    const adopter = await database.transaction("rw", database.attachments, async () => {
      const created = await storage.attachments.create(input());
      // A separate connection still inherits Dexie's ambient async scope.
      // Queue its writer outside that scope, as an independent tab would.
      cleanup = Dexie.ignoreTransaction(() => peer.attachmentBinary.delete(sharedKey));
      await database.attachments.get(created.id);
      return created;
    });
    expect(cleanup).toBeDefined();
    await cleanup;
    expect(Dexie.currentTransaction).toBeNull();
    const accessed = await getAttachmentBinary(adopter.id, dependencies());
    expect(accessed).toBeDefined();
    expect(await accessed?.blob.text()).toBe(contents);
  });

  it("serializes a concurrent creation before deletion across database connections", async () => {
    const first = await seed();
    let deletion: Promise<void> | undefined;
    // Queue the competing operation while the creation transaction owns the store.
    const remaining = await database.transaction("rw", database.attachments, async () => {
      const created = await storage.attachments.create(input({ ownerType: "knowledge" }));
      deletion = Dexie.ignoreTransaction(() => peer.attachments.delete(first.id, coordinated));
      await database.attachments.get(created.id);
      return created;
    });
    expect(deletion).toBeDefined();
    await deletion;
    expect(Dexie.currentTransaction).toBeNull();
    expect(await storage.attachments.getById(first.id)).toBeUndefined();
    const accessed = await getAttachmentBinary(remaining.id, dependencies());
    expect(accessed).toBeDefined();
    expect(await accessed?.blob.text()).toBe(contents);
  });

  it("serializes deletion before a new reference with an existing survivor", async () => {
    const first = await seed();
    const survivor = await storage.attachments.create(input());
    let creation: ReturnType<typeof peer.attachments.create> | undefined;
    await database.transaction("rw", database.attachments, database.attachmentBlobs, async () => {
      await storage.attachments.delete(first.id, coordinated);
      creation = Dexie.ignoreTransaction(() =>
        peer.attachments.create(input({ ownerType: "knowledge" }))
      );
      await database.attachmentBlobs.get(sharedKey);
    });
    const created = await creation;
    expect(created).toBeDefined();
    expect(Dexie.currentTransaction).toBeNull();
    expect(await storage.attachments.getById(first.id)).toBeUndefined();
    expect(await getAttachmentBinary(survivor.id, dependencies())).toBeDefined();
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(true);
    const accessed = created && await getAttachmentBinary(created.id, dependencies());
    expect(accessed).toBeDefined();
    expect(await accessed?.blob.text()).toBe(contents);
  });

  it("serializes concurrent deletion of both references without leaving an orphan", async () => {
    const first = await seed();
    const second = await storage.attachments.create(input({ ownerType: "knowledge" }));
    await Promise.all([
      storage.attachments.delete(first.id, coordinated),
      peer.attachments.delete(second.id, coordinated),
    ]);
    expect(await storage.attachments.listAll()).toEqual([]);
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(false);
  });

  it("makes concurrent deletion of the same ID idempotent", async () => {
    const attachment = await seed();
    await Promise.all([
      storage.attachments.delete(attachment.id, coordinated),
      peer.attachments.delete(attachment.id, coordinated),
    ]);
    expect(await storage.attachmentBinary.has(sharedKey)).toBe(false);
  });

  it("retains real file creation and binary access behavior", async () => {
    const created = await createAttachmentForFile({
      ownerType: "resource",
      ownerId: "resource-synthetic",
      file: new File([contents], "synthetic.txt", { type: "text/plain" }),
    }, dependencies());
    expect(await (await getAttachmentBinary(created.id, dependencies()))?.blob.text()).toBe(contents);
    await deleteAttachment(created.id, dependencies());
    expect(await getAttachmentBinary(created.id, dependencies())).toBeUndefined();
  });

  it("round-trips a shared package using the real adapters then preserves the survivor", async () => {
    const first = await seed();
    const second = await storage.attachments.create(input({ ownerType: "knowledge" }));
    const exported = await exportAttachmentPackage(dependencies());
    expect(exported.binaryCount).toBe(1);
    // Explicit clear-all is intentionally destructive; it is not ordinary deletion.
    await storage.backup.clearAll();
    await importAttachmentPackage({
      manifestFile: exported.manifestBlob,
      bundleFile: exported.bundleBlob,
    }, dependencies());
    await deleteAttachment(first.id, dependencies());
    const accessed = await getAttachmentBinary(second.id, dependencies());
    expect(await accessed?.blob.text()).toBe(contents);
    expect((await exportAttachmentPackage(dependencies())).binaryCount).toBe(1);
    peerDatabase.close();
    await peerDatabase.open();
    expect(await peer.attachments.getById(second.id)).toEqual(second);
    expect(await (await peer.attachmentBinary.retrieve(sharedKey))?.text()).toBe(contents);
  });

  it("revalidates stale package reuse after the final reference was deleted", async () => {
    const first = await seed();
    const exported = await exportAttachmentPackage(dependencies());
    exported.manifest.attachments[0] = {
      ...first, id: "incoming-synthetic", ownerType: "knowledge",
    };
    const importPackage = storage.attachments.importPackage.bind(storage.attachments);
    vi.spyOn(storage.attachments, "importPackage").mockImplementationOnce(async (data) => {
      // Runs after file preflight, but before the atomic import transaction.
      await peer.attachments.delete(first.id, coordinated);
      return importPackage(data);
    });
    await importAttachmentPackage({
      manifestFile: new Blob([JSON.stringify(exported.manifest)]),
      bundleFile: exported.bundleBlob,
    }, dependencies());
    expect(await storage.attachments.getById(first.id)).toBeUndefined();
    expect(await storage.attachments.getById("incoming-synthetic")).toBeDefined();
    expect(await (await getAttachmentBinary("incoming-synthetic", dependencies()))?.blob.text()).toBe(contents);
  });

  it("preserves shared content for a concurrent adopter when package import aborts", async () => {
    await seed();
    await storage.attachments.create(input({ ownerType: "knowledge" }));
    const exported = await exportAttachmentPackage(dependencies());
    await storage.backup.clearAll();
    await storage.attachmentBinary.save(sharedKey, new Blob([contents]));
    let restored = 0;
    let adopter: ReturnType<typeof peer.attachments.create> | undefined;
    const failLate = () => {
      if (restored++ === 0) return;
      adopter = Dexie.ignoreTransaction(() =>
        peer.attachments.create(input({ ownerId: "concurrent-adopter" }))
      );
      throw new Error("synthetic import failure");
    };
    database.attachments.hook("creating", failLate);
    try {
      const importing = importAttachmentPackage({
        manifestFile: exported.manifestBlob, bundleFile: exported.bundleBlob,
      }, dependencies());
      await expect(importing).rejects.toThrow();
      await expect(importing).rejects.toMatchObject({
        cause: expect.objectContaining({ message: "synthetic import failure" }),
      });
    } finally {
      database.attachments.hook("creating").unsubscribe(failLate);
    }
    const created = await adopter;
    expect(created).toBeDefined();
    expect(await storage.attachments.listAll()).toEqual([
      expect.objectContaining({ id: created?.id }),
    ]);
    const accessed = created && await getAttachmentBinary(created.id, dependencies());
    expect(await accessed?.blob.text()).toBe(contents);
  });
});
