import { describe, expect, it, vi } from "vitest";

import type { AttachmentRepository } from "@/core/repositories";
import type { AttachmentPackageImportData } from "@/core/repositories/attachmentPackageImport";
import type { BinaryStorage } from "@/core/storage";
import type { Attachment } from "@/shared/types";
import {
  AttachmentPackageConflictError,
  exportAttachmentPackage,
  importAttachmentPackage,
} from "../attachmentPackage";

const makeAttachment = (
  id: string,
  storageKey: string,
  filename = `${id}.pdf`,
  size = 5
): Attachment => ({
  id,
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename,
  mimeType: "application/pdf",
  size,
  storageKey,
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-05T08:30:00.000Z",
});

function createDependencies(
  initialMetadata: Attachment[] = [],
  initialBinaries: Record<string, string> = {}
) {
  const metadata = new Map(initialMetadata.map((item) => [item.id, item]));
  const binaries = new Map(
    Object.entries(initialBinaries).map(([key, value]) => [
      key,
      new Blob([value], { type: "application/octet-stream" }),
    ])
  );

  const attachments: AttachmentRepository & {
    restore(attachment: Attachment): Promise<void>;
  } = {
    importPackage: vi.fn(async (data: AttachmentPackageImportData) => {
      const addedMetadata = data.attachments.filter((record) => !metadata.has(record.id));
      const addedBinaries = data.binaries.filter((binary) => !binaries.has(binary.storageKey));
      for (const record of addedMetadata) metadata.set(record.id, record);
      for (const binary of addedBinaries) {
        binaries.set(binary.storageKey, new Blob([Uint8Array.from(binary.bytes)]));
      }
      return {
        importedMetadataCount: addedMetadata.length,
        importedBinaryCount: addedBinaries.length,
        reusedMetadataCount: data.attachments.length - addedMetadata.length,
        reusedBinaryCount: data.binaries.length - addedBinaries.length,
      };
    }),
    create: vi.fn(),
    getById: vi.fn(async (id: string) => metadata.get(id)),
    listAll: vi.fn(async () => [...metadata.values()]),
    listByOwner: vi.fn(),
    delete: vi.fn(async (id: string) => {
      metadata.delete(id);
    }),
    restore: vi.fn(async (attachment: Attachment) => {
      metadata.set(attachment.id, attachment);
    }),
  };
  const binaryStorage: BinaryStorage = {
    save: vi.fn(async (storageKey: string, value: Blob) => {
      binaries.set(storageKey, value);
    }),
    retrieve: vi.fn(async (storageKey: string) => binaries.get(storageKey)),
    has: vi.fn(async (storageKey: string) => binaries.has(storageKey)),
    listKeys: vi.fn(async () => [...binaries.keys()]),
    delete: vi.fn(async (storageKey: string) => {
      binaries.delete(storageKey);
    }),
  };

  return { attachments, binaryStorage, metadata, binaries };
}

describe("attachment package export/import", () => {
  it("exports each shared storageKey binary once", async () => {
    const first = makeAttachment("first", "attachments/shared", undefined, 6);
    const second = makeAttachment("second", "attachments/shared", "copy.pdf", 6);
    const dependencies = createDependencies(
      [first, second],
      { "attachments/shared": "shared" }
    );

    const result = await exportAttachmentPackage(
      dependencies,
      new Date("2026-07-05T08:30:00.000Z")
    );

    expect(result.attachmentCount).toBe(2);
    expect(result.binaryCount).toBe(1);
    expect(result.manifest.attachments).toEqual([first, second]);
    expect(result.manifest.binaries).toEqual([
      { storageKey: "attachments/shared", offset: 0, length: 6 },
    ]);
    expect(await result.bundleBlob.text()).toBe("shared");
  });

  it("imports metadata and binaries through their separate boundaries", async () => {
    const attachment = makeAttachment("incoming", "attachments/incoming");
    const source = createDependencies(
      [attachment],
      { "attachments/incoming": "hello" }
    );
    const exported = await exportAttachmentPackage(source);
    const destination = createDependencies();

    const result = await importAttachmentPackage(
      {
        manifestFile: exported.manifestBlob,
        bundleFile: exported.bundleBlob,
      },
      destination
    );

    expect(result).toMatchObject({
      importedMetadataCount: 1,
      importedBinaryCount: 1,
      reusedMetadataCount: 0,
      reusedBinaryCount: 0,
    });
    expect(destination.metadata.get(attachment.id)).toEqual(attachment);
    expect(await destination.binaries.get(attachment.storageKey)?.text()).toBe(
      "hello"
    );
  });

  it("rejects metadata ID conflicts before any package mutation", async () => {
    const incoming = makeAttachment("same-id", "attachments/incoming", undefined, 8);
    const source = createDependencies(
      [incoming],
      { "attachments/incoming": "incoming" }
    );
    const exported = await exportAttachmentPackage(source);
    const destination = createDependencies([
      makeAttachment("same-id", "attachments/existing", "existing.pdf"),
    ]);

    const error = await importAttachmentPackage(
      {
        manifestFile: exported.manifestBlob,
        bundleFile: exported.bundleBlob,
      },
      destination
    ).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(AttachmentPackageConflictError);
    expect((error as AttachmentPackageConflictError).conflicts).toEqual([
      {
        type: "metadata_id_conflict",
        attachmentId: "same-id",
        storageKey: "attachments/incoming",
        reason:
          "The existing metadata points to attachments/existing, but the package points to attachments/incoming.",
      },
    ]);
    expect(destination.attachments.restore).not.toHaveBeenCalled();
    expect(destination.binaryStorage.save).not.toHaveBeenCalled();
  });

  it("rejects incompatible existing storageKey content with clear details", async () => {
    const incoming = makeAttachment("incoming", "attachments/shared", undefined, 15);
    const source = createDependencies(
      [incoming],
      { "attachments/shared": "package-content" }
    );
    const exported = await exportAttachmentPackage(source);
    const destination = createDependencies(
      [],
      { "attachments/shared": "different-content" }
    );

    const error = await importAttachmentPackage(
      {
        manifestFile: exported.manifestBlob,
        bundleFile: exported.bundleBlob,
      },
      destination
    ).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(AttachmentPackageConflictError);
    expect((error as AttachmentPackageConflictError).conflicts).toEqual([
      expect.objectContaining({
        type: "storage_key_conflict",
        storageKey: "attachments/shared",
        reason: expect.stringContaining("differs"),
      }),
    ]);
    expect(destination.attachments.restore).not.toHaveBeenCalled();
    expect(destination.binaryStorage.save).not.toHaveBeenCalled();
  });

  it.each(["duplicate metadata", "duplicate binary", "missing binary", "orphan binary", "invalid range"])(
    "rejects %s without calling the mutation boundary", async (defect) => {
      const first = makeAttachment("first", "attachments/first");
      const second = makeAttachment("second", "attachments/second", undefined, 6);
      const source = createDependencies([first, second], {
        "attachments/first": "first", "attachments/second": "second",
      });
      const exported = await exportAttachmentPackage(source);
      const manifest = exported.manifest;
      if (defect === "duplicate metadata") manifest.attachments.push(first);
      if (defect === "duplicate binary") manifest.binaries.push(manifest.binaries[0]);
      if (defect === "missing binary") manifest.binaries.pop();
      if (defect === "orphan binary") manifest.attachments.pop();
      if (defect === "invalid range") manifest.binaries[0].length = 100;
      const destination = createDependencies();
      await expect(importAttachmentPackage({
        manifestFile: new Blob([JSON.stringify(manifest)]), bundleFile: exported.bundleBlob,
      }, destination)).rejects.toBeInstanceOf(AttachmentPackageConflictError);
      expect(destination.attachments.importPackage).not.toHaveBeenCalled();
      expect(destination.metadata.size).toBe(0);
      expect(destination.binaries.size).toBe(0);
    }
  );

  it("fails closed if the adapter cannot provide atomic import", async () => {
    const record = makeAttachment("first", "attachments/first");
    const exported = await exportAttachmentPackage(createDependencies([record], { "attachments/first": "first" }));
    const destination = createDependencies();
    delete destination.attachments.importPackage;
    await expect(importAttachmentPackage({
      manifestFile: exported.manifestBlob, bundleFile: exported.bundleBlob,
    }, destination)).rejects.toThrow("Atomic attachment package import is unavailable");
    expect(destination.attachments.restore).not.toHaveBeenCalled();
    expect(destination.binaryStorage.save).not.toHaveBeenCalled();
  });

  it.each([0, 4, 6])("rejects a declared size of %i for five bytes before mutation", async (declaredSize) => {
    const incoming = makeAttachment("incoming", "attachments/incoming");
    const exported = await exportAttachmentPackage(createDependencies([incoming], {
      "attachments/incoming": "hello",
    }));
    exported.manifest.attachments[0].size = declaredSize;
    const existing = makeAttachment("existing", "attachments/existing");
    const destination = createDependencies([existing], { "attachments/existing": "saved" });
    await expect(importAttachmentPackage({
      manifestFile: new Blob([JSON.stringify(exported.manifest)]), bundleFile: exported.bundleBlob,
    }, destination)).rejects.toMatchObject({
      conflicts: [{
        type: "metadata_binary_size_mismatch", attachmentId: incoming.id,
        storageKey: incoming.storageKey,
        reason: `The metadata declares ${declaredSize} bytes, but its binary contains 5 bytes.`,
      }],
    });
    expect(destination.attachments.importPackage).not.toHaveBeenCalled();
    expect(destination.metadata).toEqual(new Map([[existing.id, existing]]));
    expect([...destination.binaries.keys()]).toEqual([existing.storageKey]);
    expect(await destination.binaries.get(existing.storageKey)?.text()).toBe("saved");
  });

  it("checks every shared reference against the same binary byte length", async () => {
    const first = makeAttachment("first", "attachments/shared");
    const second = { ...makeAttachment("second", first.storageKey), ownerType: "knowledge" as const };
    const third = makeAttachment("third", first.storageKey);
    const exported = await exportAttachmentPackage(createDependencies([first, second, third], {
      [first.storageKey]: "hello",
    }));
    exported.manifest.attachments[0].size = 4;
    exported.manifest.attachments[1].size = 6;
    const destination = createDependencies([third], { [first.storageKey]: "hello" });
    await expect(importAttachmentPackage({
      manifestFile: new Blob([JSON.stringify(exported.manifest)]), bundleFile: exported.bundleBlob,
    }, destination)).rejects.toMatchObject({
      conflicts: [
        expect.objectContaining({ type: "metadata_binary_size_mismatch", attachmentId: first.id, storageKey: first.storageKey }),
        expect.objectContaining({ type: "metadata_binary_size_mismatch", attachmentId: second.id, storageKey: first.storageKey }),
      ],
    });
    expect(destination.attachments.importPackage).not.toHaveBeenCalled();
    expect([...destination.metadata.values()]).toEqual([third]);
    expect([...destination.binaries.keys()]).toEqual([first.storageKey]);
    expect(await destination.binaries.get(first.storageKey)?.text()).toBe("hello");
  });

  it.each(["سلام🌱", ""])("accepts the exact byte size for %j", async (content) => {
    const record = makeAttachment("incoming", "attachments/incoming", undefined, new Blob([content]).size);
    const exported = await exportAttachmentPackage(createDependencies([record], { [record.storageKey]: content }));
    const destination = createDependencies();
    await importAttachmentPackage({ manifestFile: exported.manifestBlob, bundleFile: exported.bundleBlob }, destination);
    expect(destination.metadata.get(record.id)?.size).toBe(new Blob([content]).size);
    expect(await destination.binaries.get(record.storageKey)?.text()).toBe(content);
  });
});
