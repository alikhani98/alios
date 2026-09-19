import { describe, expect, it } from "vitest";

import {
  resolveAttachmentsForOwner,
  resolveKnowledgeAttachmentContext,
  resolveResourceAttachmentContext,
} from "../attachmentRelationships";
import type { Attachment } from "@/shared/types";

const resourceAttachment: Attachment = {
  id: "resource-attachment",
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename: "book.pdf",
  mimeType: "application/pdf",
  size: 10,
  storageKey: "resource-1/book.pdf",
  createdAt: "2026-09-18T10:00:00.000Z",
  updatedAt: "2026-09-18T10:00:00.000Z",
};

const newerResourceAttachment: Attachment = {
  ...resourceAttachment,
  id: "newer-resource-attachment",
  filename: "notes.pdf",
  storageKey: "resource-1/notes.pdf",
  createdAt: "2026-09-19T10:00:00.000Z",
  updatedAt: "2026-09-19T10:00:00.000Z",
};

const knowledgeAttachment: Attachment = {
  ...resourceAttachment,
  id: "knowledge-attachment",
  ownerType: "knowledge",
  ownerId: "knowledge-1",
  kind: "image",
  filename: "diagram.png",
  mimeType: "image/png",
  storageKey: "knowledge-1/diagram.png",
};

describe("attachment ownership relationships", () => {
  it("resolves multiple attachments for a Resource in newest-first order", () => {
    expect(
      resolveAttachmentsForOwner(
        [resourceAttachment, newerResourceAttachment, knowledgeAttachment],
        "resource",
        "resource-1"
      )
    ).toEqual([newerResourceAttachment, resourceAttachment]);
  });

  it("resolves Knowledge ownership without mixing Resource attachments", () => {
    const context = resolveKnowledgeAttachmentContext(
      [resourceAttachment, knowledgeAttachment],
      "knowledge-1"
    );

    expect(context.ownerType).toBe("knowledge");
    expect(context.ownerId).toBe("knowledge-1");
    expect(context.attachments).toEqual([knowledgeAttachment]);
  });

  it("returns an empty context for empty or unavailable metadata", () => {
    expect(resolveAttachmentsForOwner([], "resource", "resource-1")).toEqual(
      []
    );
    expect(
      resolveAttachmentsForOwner(
        [undefined, null, resourceAttachment],
        "resource",
        "deleted-resource"
      )
    ).toEqual([]);
    expect(
      resolveResourceAttachmentContext([resourceAttachment], " ")
    ).toEqual({
      ownerType: "resource",
      ownerId: " ",
      attachments: [],
    });
  });
});
