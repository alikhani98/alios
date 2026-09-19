import { describe, expect, it, vi } from "vitest";

import type {
  AttachmentRepository,
  CreateAttachmentInput,
} from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import type { Attachment } from "@/shared/types";
import {
  createAttachmentForFile,
  deleteAttachment,
} from "../attachmentWorkflow";

function createDependencies() {
  let sequence = 0;
  const records = new Map<string, Attachment>();
  const attachments: AttachmentRepository = {
    create: vi.fn(async (input: CreateAttachmentInput) => {
      const id = `attachment-${++sequence}`;
      const timestamp = "2026-07-05T08:30:00.000Z";
      const attachment: Attachment = {
        ...input,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      records.set(id, attachment);
      return attachment;
    }),
    getById: vi.fn(async (id: string) => records.get(id)),
    listAll: vi.fn(async () => [...records.values()]),
    listByOwner: vi.fn(async (ownerType, ownerId) =>
      [...records.values()].filter(
        (attachment) =>
          attachment.ownerType === ownerType && attachment.ownerId === ownerId
      )
    ),
    delete: vi.fn(async (id: string) => {
      records.delete(id);
    }),
  };
  const binaryStorage: BinaryStorage = {
    save: vi.fn(async () => undefined),
    retrieve: vi.fn(async () => undefined),
    has: vi.fn(async () => true),
    listKeys: vi.fn(async () => []),
    delete: vi.fn(async () => undefined),
  };

  return { attachments, binaryStorage };
}

describe("attachment creation workflow", () => {
  it("creates metadata and saves the binary for the same storage key", async () => {
    const dependencies = createDependencies();
    const file = new File(["pdf contents"], "book.pdf", {
      type: "application/pdf",
    });

    const attachment = await createAttachmentForFile(
      {
        ownerType: "resource",
        ownerId: "resource-1",
        file,
      },
      {
        ...dependencies,
        createId: () => "fixed-attachment",
      }
    );

    expect(attachment.ownerType).toBe("resource");
    expect(attachment.ownerId).toBe("resource-1");
    expect(attachment.kind).toBe("document");
    expect(attachment.storageKey).toBe("attachments/fixed-attachment");
    expect(dependencies.attachments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerType: "resource",
        ownerId: "resource-1",
        filename: "book.pdf",
        mimeType: "application/pdf",
        size: file.size,
        storageKey: "attachments/fixed-attachment",
      })
    );
    expect(dependencies.binaryStorage.save).toHaveBeenCalledWith(
      attachment.storageKey,
      file
    );
  });

  it("rejects empty files before creating metadata", async () => {
    const dependencies = createDependencies();
    const file = new File([], "empty.txt", { type: "text/plain" });

    await expect(
      createAttachmentForFile(
        { ownerType: "knowledge", ownerId: "knowledge-1", file },
        dependencies
      )
    ).rejects.toThrow("cannot be empty");

    expect(dependencies.attachments.create).not.toHaveBeenCalled();
  });

  it("cleans up metadata when binary storage fails", async () => {
    const dependencies = createDependencies();
    const saveError = new Error("disk full");
    vi.mocked(dependencies.binaryStorage.save).mockRejectedValue(saveError);
    const file = new File(["image"], "diagram.png", { type: "image/png" });

    await expect(
      createAttachmentForFile(
        { ownerType: "knowledge", ownerId: "knowledge-1", file },
        dependencies
      )
    ).rejects.toBe(saveError);

    expect(dependencies.attachments.delete).toHaveBeenCalledWith(
      "attachment-1"
    );
    await expect(
      dependencies.attachments.listByOwner("knowledge", "knowledge-1")
    ).resolves.toEqual([]);
  });
});

describe("attachment deletion workflow", () => {
  it("deletes metadata and then the binary", async () => {
    const dependencies = createDependencies();
    const file = new File(["audio"], "lesson.mp3", { type: "audio/mpeg" });
    const attachment = await createAttachmentForFile(
      { ownerType: "resource", ownerId: "resource-1", file },
      { ...dependencies, createId: () => "audio-attachment" }
    );

    await deleteAttachment(attachment.id, dependencies);

    expect(dependencies.attachments.delete).toHaveBeenLastCalledWith(
      attachment.id
    );
    expect(dependencies.binaryStorage.delete).toHaveBeenCalledWith(
      attachment.storageKey
    );
    expect(
      await dependencies.attachments.getById(attachment.id)
    ).toBeUndefined();
  });

  it("keeps Resource and Knowledge ownership isolated", async () => {
    const dependencies = createDependencies();
    const resourceFile = new File(["resource"], "resource.pdf", {
      type: "application/pdf",
    });
    const knowledgeFile = new File(["knowledge"], "note.png", {
      type: "image/png",
    });

    await createAttachmentForFile(
      { ownerType: "resource", ownerId: "shared-id", file: resourceFile },
      { ...dependencies, createId: () => "resource-attachment" }
    );
    await createAttachmentForFile(
      { ownerType: "knowledge", ownerId: "shared-id", file: knowledgeFile },
      { ...dependencies, createId: () => "knowledge-attachment" }
    );

    await expect(
      dependencies.attachments.listByOwner("resource", "shared-id")
    ).resolves.toHaveLength(1);
    await expect(
      dependencies.attachments.listByOwner("knowledge", "shared-id")
    ).resolves.toHaveLength(1);
  });
});
