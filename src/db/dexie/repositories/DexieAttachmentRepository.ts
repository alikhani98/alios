import type {
  AttachmentRepository,
  CreateAttachmentInput,
} from "@/core/repositories";
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
      await this.database.attachments.put(attachmentSchema.parse(attachment));
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

  async delete(id: string): Promise<void> {
    return this.execute("deleting an attachment", async () => {
      this.requireEntity(
        "Attachment",
        id,
        await this.database.attachments.get(id)
      );
      await this.database.attachments.delete(id);
    });
  }
}
