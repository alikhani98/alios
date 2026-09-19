import { ValidationError } from "@/core/errors";
import type {
  AttachmentRepository,
  CreateAttachmentInput,
} from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import type {
  Attachment,
  AttachmentKind,
  AttachmentOwnerType,
} from "@/shared/types";

export type CreateAttachmentForFileInput = {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  file: File;
};

export type AttachmentWorkflowDependencies = {
  attachments: AttachmentRepository;
  binaryStorage: BinaryStorage;
  createId?: () => string;
};

export async function createAttachmentForFile(
  input: CreateAttachmentForFileInput,
  dependencies: AttachmentWorkflowDependencies
): Promise<Attachment> {
  validateAttachmentFileInput(input);

  const id = dependencies.createId?.() ?? createAttachmentId();
  const storageKey = `attachments/${id}`;
  const metadataInput: CreateAttachmentInput = {
    ownerType: input.ownerType,
    ownerId: input.ownerId.trim(),
    kind: inferAttachmentKind(input.file.type),
    filename: input.file.name.trim(),
    mimeType: input.file.type.trim() || "application/octet-stream",
    size: input.file.size,
    storageKey,
  };

  const attachment = await dependencies.attachments.create(metadataInput);

  try {
    await dependencies.binaryStorage.save(storageKey, input.file);
  } catch (error) {
    try {
      await dependencies.attachments.delete(attachment.id);
    } catch {
      // Preserve the binary-save error; cleanup is best effort at this boundary.
    }
    throw error;
  }

  return attachment;
}

export async function deleteAttachment(
  id: string,
  dependencies: AttachmentWorkflowDependencies
): Promise<void> {
  const attachment = await dependencies.attachments.getById(id);
  if (!attachment) {
    return;
  }

  await dependencies.attachments.delete(id);
  await dependencies.binaryStorage.delete(attachment.storageKey);
}

function validateAttachmentFileInput({
  ownerType,
  ownerId,
  file,
}: CreateAttachmentForFileInput): void {
  if (!ownerType || !ownerId.trim()) {
    throw new ValidationError("An attachment owner is required.");
  }

  if (!file || file.size <= 0) {
    throw new ValidationError("The attachment file cannot be empty.");
  }

  if (!file.name.trim()) {
    throw new ValidationError("The attachment file must have a name.");
  }
}

function inferAttachmentKind(mimeType: string): AttachmentKind {
  const normalizedMimeType = mimeType.trim().toLocaleLowerCase();

  if (normalizedMimeType.startsWith("image/")) {
    return "image";
  }

  if (normalizedMimeType.startsWith("audio/")) {
    return "audio";
  }

  if (
    normalizedMimeType === "application/pdf" ||
    normalizedMimeType.startsWith("text/") ||
    normalizedMimeType.includes("document") ||
    normalizedMimeType.includes("word")
  ) {
    return "document";
  }

  return "other";
}

function createAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
