import { describe, expect, it, vi } from "vitest";

import type { AttachmentRepository } from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import type { Attachment } from "@/shared/types";
import { buildAttachmentIntegritySnapshot } from "../attachmentIntegrity";

const attachment = (id: string, storageKey = `attachments/${id}`): Attachment => ({
  id,
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename: `${id}.pdf`,
  mimeType: "application/pdf",
  size: 10,
  storageKey,
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-05T08:30:00.000Z",
});

function createDependencies(
  metadata: Attachment[],
  binaryKeys: string[] = metadata.map((item) => item.storageKey)
) {
  const attachments: AttachmentRepository = {
    create: vi.fn(),
    getById: vi.fn(),
    listAll: vi.fn(async () => metadata),
    listByOwner: vi.fn(),
    delete: vi.fn(),
  };
  const binaryStorage: BinaryStorage = {
    save: vi.fn(),
    retrieve: vi.fn(),
    has: vi.fn(async (storageKey: string) => binaryKeys.includes(storageKey)),
    listKeys: vi.fn(async () => binaryKeys),
    delete: vi.fn(),
  };

  return { attachments, binaryStorage };
}

describe("attachment integrity diagnostics", () => {
  it("reports a clean snapshot when metadata and binaries agree", async () => {
    const dependencies = createDependencies([attachment("one")]);

    await expect(buildAttachmentIntegritySnapshot(dependencies)).resolves.toMatchObject({
      complete: true,
      issues: [],
    });
  });

  it("reports metadata without binary", async () => {
    const item = attachment("missing-binary");
    const dependencies = createDependencies([item], []);

    const snapshot = await buildAttachmentIntegritySnapshot(dependencies);

    expect(snapshot.issues).toEqual([
      { type: "metadata_without_binary", attachment: item },
    ]);
  });

  it("reports binary without metadata", async () => {
    const dependencies = createDependencies([], ["attachments/orphan"]);

    const snapshot = await buildAttachmentIntegritySnapshot(dependencies);

    expect(snapshot.issues).toEqual([
      { type: "binary_without_metadata", storageKey: "attachments/orphan" },
    ]);
  });

  it("reports unavailable storage records when binary checks fail", async () => {
    const item = attachment("unavailable");
    const dependencies = createDependencies([item]);
    vi.mocked(dependencies.binaryStorage.has).mockRejectedValue(
      new Error("storage unavailable")
    );

    const snapshot = await buildAttachmentIntegritySnapshot(dependencies);

    expect(snapshot.issues).toEqual([
      { type: "unavailable_storage_record", attachment: item },
    ]);
  });

  it("treats duplicate metadata storage keys as valid shared-binary references", async () => {
    const first = attachment("first", "attachments/shared");
    const second = attachment("second", "attachments/shared");
    const dependencies = createDependencies([first, second], ["attachments/shared"]);

    const snapshot = await buildAttachmentIntegritySnapshot(dependencies);

    expect(snapshot).toMatchObject({ complete: true, issues: [] });
    expect(dependencies.binaryStorage.has).toHaveBeenCalledTimes(2);
  });

  it("marks the snapshot incomplete when binary key enumeration is unavailable", async () => {
    const item = attachment("known");
    const dependencies = createDependencies([item]);
    vi.mocked(dependencies.binaryStorage.listKeys).mockRejectedValue(
      new Error("cannot enumerate storage")
    );

    const snapshot = await buildAttachmentIntegritySnapshot(dependencies);

    expect(snapshot.complete).toBe(false);
    expect(snapshot.issues).toEqual([]);
  });
});
