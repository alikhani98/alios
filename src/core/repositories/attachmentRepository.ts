import type { Attachment, AttachmentOwnerType } from "@/shared/types";
import type {
  AttachmentPackageImportData,
  AttachmentPackageImportResult,
} from "./attachmentPackageImport";

export type CreateAttachmentInput = Omit<
  Attachment,
  "id" | "createdAt" | "updatedAt"
>;

export type DeleteAttachmentOptions = Readonly<{
  /** Remove metadata atomically with binary cleanup; retain any shared binary. */
  deleteUnreferencedBinary?: boolean;
}>;

export interface AttachmentRepository {
  /** Prepared package only; revalidate current state and commit both stores atomically. */
  importPackage?(data: AttachmentPackageImportData): Promise<AttachmentPackageImportResult>;
  create(input: CreateAttachmentInput): Promise<Attachment>;
  getById(id: string): Promise<Attachment | undefined>;
  listAll(): Promise<Attachment[]>;
  listByOwner(
    ownerType: AttachmentOwnerType,
    ownerId: string
  ): Promise<Attachment[]>;
  /** Missing IDs are a no-op. By default, only metadata is removed (rollback). */
  delete(id: string, options?: DeleteAttachmentOptions): Promise<void>;
}
