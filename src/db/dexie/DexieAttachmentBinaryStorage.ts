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

  async has(storageKey: string): Promise<boolean> {
    try {
      return (await this.database.attachmentBlobs.get(storageKey)) !== undefined;
    } catch (error) {
      throw new StorageError("Attachment content could not be checked.", {
        cause: error,
      });
    }
  }

  async listKeys(): Promise<string[]> {
    try {
      return this.database.attachmentBlobs.toCollection().primaryKeys();
    } catch (error) {
      throw new StorageError("Attachment content keys could not be listed.", {
        cause: error,
      });
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      // Package rollback must not remove content adopted by another attachment.
      await this.database.transaction(
        "rw",
        this.database.attachments,
        this.database.attachmentBlobs,
        async () => {
          const references = await this.database.attachments
            .filter((record) => record.storageKey === storageKey)
            .count();
          if (references === 0) {
            await this.database.attachmentBlobs.delete(storageKey);
          }
        }
      );
    } catch (error) {
      throw new StorageError("Attachment content could not be deleted.", {
        cause: error,
      });
    }
  }
}
