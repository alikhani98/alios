import { describe, expect, it, vi } from "vitest";

import type { AttachmentRepository } from "@/core/repositories";
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
  filename = `${id}.pdf`
): Attachment => ({
  id,
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename,
  mimeType: "application/pdf",
  size: 5,
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
    create: vi.fn(),
    getById: vi.fn(async (id) => metadata.get(id)),
    listAll: vi.fn(async () => [...metadata.values()]),
    listByOwner: vi.fn(),
    delete: vi.fn(async (id) => {
      metadata.delete(id);
    }),
    restore: vi.fn(async (attachment) => {
      metadata.set(attachment.id, attachment);
    }),
  };
  const binaryStorage: BinaryStorage = {
    save: vi.fn(async (storageKey, value) => {
      binaries.set(storageKey, value);
    }),
    retrieve: vi.fn(async (storageKey) => binaries.get(storageKey)),
    has: vi.fn(async (storageKey) => binaries.has(storageKey)),
    listKeys: vi.fn(async () => [...binaries.keys()]),
    delete: vi.fn(async (storageKey) => {
      binaries.delete(storageKey);
    }),
  };

  return { attachments, binaryStorage, metadata, binaries };
}

describe("attachment package export/import", () => {
  it("exports each shared storageKey binary once", async () => {
    const first = makeAttachment("first", "attachments/shared");
    const second = makeAttachment("second", "attachments/shared", "copy.pdf");
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
    const incoming = makeAttachment("same-id", "attachments/incoming");
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
    const incoming = makeAttachment("incoming", "attachments/shared");
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
});
