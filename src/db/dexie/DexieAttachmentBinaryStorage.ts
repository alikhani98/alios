import { StorageError } from "@/core/errors";
import type { BinaryStorage } from "@/core/storage";

import type { AliosDatabase } from "./db";

export class DexieAttachmentBinaryStorage implements BinaryStorage {
  constructor(private readonly database: AliosDatabase) {}

  async save(storageKey: string, value: Blob): Promise<void> {
    try {
      await this.database.attachmentBlobs.put({ storageKey, blob: value });
    } catch (error) {
      throw new StorageError("Attachment content could not be saved.", {
        cause: error,
      });
    }
  }

  async retrieve(storageKey: string): Promise<Blob | undefined> {
    try {
      const record = await this.database.attachmentBlobs.get(storageKey);
      return record?.blob;
    } catch (error) {
      throw new StorageError("Attachment content could not be read.", {
        cause: error,
      });
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await this.database.attachmentBlobs.delete(storageKey);
    } catch (error) {
      throw new StorageError("Attachment content could not be deleted.", {
        cause: error,
      });
    }
  }
}
