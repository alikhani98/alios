import type {
  Attachment,
  AttachmentOwnerType,
} from "@/shared/types";

export type AttachmentOwnerContext = Readonly<{
  ownerType: AttachmentOwnerType;
  ownerId: string;
  attachments: ReadonlyArray<Attachment>;
}>;

type MaybeAttachment = Attachment | null | undefined;

/**
 * Resolves attachment metadata without consulting binary storage or mutating data.
 * Newer metadata is returned first so future attachment surfaces have a stable order.
 */
export function resolveAttachmentsForOwner(
  attachments: ReadonlyArray<MaybeAttachment>,
  ownerType: AttachmentOwnerType,
  ownerId: string
): Attachment[] {
  const normalizedOwnerId = ownerId.trim();
  if (!normalizedOwnerId) {
    return [];
  }

  return attachments
    .filter(
      (attachment): attachment is Attachment =>
        attachment !== null &&
        attachment !== undefined &&
        attachment.ownerType === ownerType &&
        attachment.ownerId === normalizedOwnerId
    )
    .sort((left, right) => {
      const createdAtOrder = right.createdAt.localeCompare(left.createdAt);
      return createdAtOrder !== 0
        ? createdAtOrder
        : right.id.localeCompare(left.id);
    });
}

export function resolveResourceAttachmentContext(
  attachments: ReadonlyArray<MaybeAttachment>,
  resourceId: string
): AttachmentOwnerContext {
  return {
    ownerType: "resource",
    ownerId: resourceId,
    attachments: resolveAttachmentsForOwner(attachments, "resource", resourceId),
  };
}

export function resolveKnowledgeAttachmentContext(
  attachments: ReadonlyArray<MaybeAttachment>,
  knowledgeId: string
): AttachmentOwnerContext {
  return {
    ownerType: "knowledge",
    ownerId: knowledgeId,
    attachments: resolveAttachmentsForOwner(
      attachments,
      "knowledge",
      knowledgeId
    ),
  };
}
