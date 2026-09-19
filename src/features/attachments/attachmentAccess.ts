import type { AttachmentRepository } from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import type { Attachment } from "@/shared/types";

export type AttachmentAccessDependencies = {
  attachments: AttachmentRepository;
  binaryStorage: BinaryStorage;
};

export type AttachmentBinary = Readonly<{
  attachment: Attachment;
  blob: Blob;
}>;

export async function getAttachmentBinary(
  attachmentId: string,
  dependencies: AttachmentAccessDependencies
): Promise<AttachmentBinary | undefined> {
  const attachment = await dependencies.attachments.getById(attachmentId);
  if (!attachment) {
    return undefined;
  }

  const blob = await dependencies.binaryStorage.retrieve(attachment.storageKey);
  if (!blob) {
    return undefined;
  }

  return { attachment, blob };
}

export async function createAttachmentObjectUrl(
  attachmentId: string,
  dependencies: AttachmentAccessDependencies
): Promise<string | undefined> {
  const binary = await getAttachmentBinary(attachmentId, dependencies);
  return binary ? URL.createObjectURL(binary.blob) : undefined;
}

export function revokeAttachmentObjectUrl(objectUrl: string): void {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
}
