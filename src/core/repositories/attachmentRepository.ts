import type { Attachment, AttachmentOwnerType } from "@/shared/types";

export type CreateAttachmentInput = Omit<
  Attachment,
  "id" | "createdAt" | "updatedAt"
>;

export interface AttachmentRepository {
  create(input: CreateAttachmentInput): Promise<Attachment>;
  getById(id: string): Promise<Attachment | undefined>;
  listByOwner(
    ownerType: AttachmentOwnerType,
    ownerId: string
  ): Promise<Attachment[]>;
  delete(id: string): Promise<void>;
}
