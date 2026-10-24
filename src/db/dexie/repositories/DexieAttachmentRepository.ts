import type {
  AttachmentRepository,
  CreateAttachmentInput,
  DeleteAttachmentOptions,
} from "@/core/repositories";
import { StorageError } from "@/core/errors";
import {
  attachmentSchema,
  type Attachment,
  type AttachmentOwnerType,
} from "@/shared/types";

import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieAttachmentRepository
  extends DexieRepositoryBase
  implements AttachmentRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async create(input: CreateAttachmentInput): Promise<Attachment> {
    return this.execute("creating an attachment", async () => {
      const attachment = attachmentSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.attachments.add(attachment);
      return attachment;
    });
  }

  async restore(attachment: Attachment): Promise<void> {
    return this.execute("restoring an attachment", async () => {
      const parsed = attachmentSchema.parse(attachment);
      // Package preflight may precede a concurrent last-reference deletion.
      // Standard JSON restore has its own metadata-only backup boundary.
      await this.database.transaction(
        "rw",
        this.database.attachments,
        this.database.attachmentBlobs,
        async () => {
          if (!(await this.database.attachmentBlobs.get(parsed.storageKey))) {
            throw new StorageError(
              "Attachment content disappeared before package metadata could be restored."
            );
          }
          await this.database.attachments.put(parsed);
        }
      );
    });
  }

  async getById(id: string): Promise<Attachment | undefined> {
    return this.execute("reading an attachment", async () => {
      const record = await this.database.attachments.get(id);
      return record === undefined ? undefined : attachmentSchema.parse(record);
    });
  }

  async listAll(): Promise<Attachment[]> {
    return this.execute("listing all attachments", async () => {
      const records = await this.database.attachments.toArray();
      return records.map((record) => attachmentSchema.parse(record));
    });
  }

  async listByOwner(
    ownerType: AttachmentOwnerType,
    ownerId: string
  ): Promise<Attachment[]> {
    return this.execute("listing attachments for an owner", async () => {
      const records = await this.database.attachments
        .where("[ownerType+ownerId]")
        .equals([ownerType, ownerId])
        .toArray();

      return records.map((record) => attachmentSchema.parse(record));
    });
  }

  async delete(id: string, options: DeleteAttachmentOptions = {}): Promise<void> {
    return this.execute("deleting an attachment", async () => {
      await this.database.transaction(
        "rw",
        this.database.attachments,
        this.database.attachmentBlobs,
        async () => {
          const attachment = await this.database.attachments.get(id);
          if (!attachment) return;

          await this.database.attachments.delete(id);
          if (!options.deleteUnreferencedBinary) return;

          // Both stores stay locked against overlapping writers, including other tabs.
          const references = await this.database.attachments
            .filter((record) => record.storageKey === attachment.storageKey)
            .count();
          if (references === 0) {
            await this.database.attachmentBlobs.delete(attachment.storageKey);
          }
        }
      );
    });
  }
}
