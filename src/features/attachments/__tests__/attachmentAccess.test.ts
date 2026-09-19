import { afterEach, describe, expect, it, vi } from "vitest";

import type { AttachmentRepository } from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import type { Attachment } from "@/shared/types";
import {
  createAttachmentObjectUrl,
  getAttachmentBinary,
  revokeAttachmentObjectUrl,
} from "../attachmentAccess";

const attachment: Attachment = {
  id: "attachment-1",
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename: "book.pdf",
  mimeType: "application/pdf",
  size: 12,
  storageKey: "attachments/attachment-1",
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-05T08:30:00.000Z",
};

function createDependencies(binary?: Blob) {
  const attachments: AttachmentRepository = {
    create: vi.fn(),
    getById: vi.fn(async () => attachment),
    listByOwner: vi.fn(),
    delete: vi.fn(),
  };
  const binaryStorage: BinaryStorage = {
    save: vi.fn(),
    retrieve: vi.fn(async () => binary),
    delete: vi.fn(),
  };

  return { attachments, binaryStorage };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("attachment access workflow", () => {
  it("retrieves metadata and binary through repository boundaries", async () => {
    const blob = new Blob(["file contents"], { type: attachment.mimeType });
    const dependencies = createDependencies(blob);

    await expect(
      getAttachmentBinary(attachment.id, dependencies)
    ).resolves.toEqual({ attachment, blob });
    expect(dependencies.attachments.getById).toHaveBeenCalledWith(attachment.id);
    expect(dependencies.binaryStorage.retrieve).toHaveBeenCalledWith(
      attachment.storageKey
    );
  });

  it("returns undefined when metadata or binary is missing", async () => {
    const missingMetadata = createDependencies(new Blob(["contents"]));
    vi.mocked(missingMetadata.attachments.getById).mockResolvedValue(undefined);
    const missingBinary = createDependencies(undefined);

    await expect(
      getAttachmentBinary(attachment.id, missingMetadata)
    ).resolves.toBeUndefined();
    await expect(
      getAttachmentBinary(attachment.id, missingBinary)
    ).resolves.toBeUndefined();
    expect(missingBinary.binaryStorage.retrieve).toHaveBeenCalledWith(
      attachment.storageKey
    );
  });

  it("creates and revokes an object URL without exposing storage details", async () => {
    const blob = new Blob(["contents"], { type: attachment.mimeType });
    const dependencies = createDependencies(blob);
    const createObjectURL = vi.fn(() => "blob:attachment-1");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    await expect(
      createAttachmentObjectUrl(attachment.id, dependencies)
    ).resolves.toBe("blob:attachment-1");

    revokeAttachmentObjectUrl("blob:attachment-1");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:attachment-1");
  });
});
