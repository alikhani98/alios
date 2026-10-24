import type {
  AttachmentRepository,
  CreateAttachmentInput,
  DeleteAttachmentOptions,
} from "@/core/repositories";
import Dexie from "dexie";
import {
  AttachmentPackageConflictError,
  collectAttachmentPackageConflicts,
  type AttachmentPackageImportData,
  type AttachmentPackageImportResult,
} from "@/core/repositories/attachmentPackageImport";
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

  async importPackage(data: AttachmentPackageImportData): Promise<AttachmentPackageImportResult> {
    // Snapshot caller-owned inputs and prepare blobs before opening a transaction.
    const attachments = data.attachments.map((attachment) => attachmentSchema.parse(attachment));
    const binaries = data.binaries.map((binary) => {
      const bytes = Uint8Array.from(binary.bytes);
      return { storageKey: binary.storageKey, bytes, blob: new Blob([bytes]) };
    });
    return this.execute("importing an attachment package", () => this.database.transaction(
      "rw", this.database.attachments, this.database.attachmentBlobs, async () => {
        const existing = (await this.database.attachments.toArray())
          .map((record) => attachmentSchema.parse(record));
        const existingById = new Map(existing.map((record) => [record.id, record]));
        const conflicts = collectAttachmentPackageConflicts(attachments, binaries, existingById);
        const binariesToCreate: typeof binaries = [];
        for (const binary of binaries) {
          const stored = await this.database.attachmentBlobs.get(binary.storageKey);
          if (!stored) {
            binariesToCreate.push(binary);
            continue;
          }
          // Blob reads are not IDB requests. Keep this exact-content comparison
          // alive explicitly; a timeout rejects and aborts the whole transaction.
          const storedBytes = new Uint8Array(
            await Dexie.waitFor(stored.blob.arrayBuffer())
          );
          if (
            storedBytes.length !== binary.bytes.length ||
            !storedBytes.every((value, index) => value === binary.bytes[index])
          ) {
            conflicts.push({
              type: "storage_key_conflict",
              storageKey: binary.storageKey,
              reason: "An existing binary uses this storageKey but its content differs from the package.",
            });
          }
        }
        if (conflicts.length > 0) throw new AttachmentPackageConflictError(conflicts);
        const metadataToCreate = attachments.filter((record) => !existingById.has(record.id));
        for (const binary of binariesToCreate) {
          await this.database.attachmentBlobs.add({ storageKey: binary.storageKey, blob: binary.blob });
        }
        for (const attachment of metadataToCreate) {
          await this.database.attachments.add(attachment);
        }
        return {
          importedMetadataCount: metadataToCreate.length,
          importedBinaryCount: binariesToCreate.length,
          reusedMetadataCount: attachments.length - metadataToCreate.length,
          reusedBinaryCount: binaries.length - binariesToCreate.length,
        };
      }
    ));
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
