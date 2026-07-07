import { StorageError, ValidationError } from "@/core/errors";
import type { BackupStorage } from "./BackupStorage";
import {
  ALIOS_BACKUP_APP,
  ALIOS_BACKUP_VERSION,
  aliosBackupSchema,
  type AliosBackup,
} from "./types";

export class BackupService {
  constructor(private readonly storage: BackupStorage) {}

  async createBackup(): Promise<AliosBackup> {
    const backup = {
      app: ALIOS_BACKUP_APP,
      backupVersion: ALIOS_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: await this.storage.readAll(),
    };

    return aliosBackupSchema.parse(backup);
  }

  parseBackup(content: string): AliosBackup {
    let input: unknown;

    try {
      input = JSON.parse(content);
    } catch (error) {
      throw new ValidationError("The selected file is not valid JSON.", {
        cause: error,
      });
    }

    const result = aliosBackupSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(
        "This file is not a valid AliOS version 1 backup.",
        { cause: result.error }
      );
    }

    return result.data;
  }

  async restoreBackup(backup: AliosBackup): Promise<void> {
    const result = aliosBackupSchema.safeParse(backup);
    if (!result.success) {
      throw new ValidationError("The backup is no longer valid.", {
        cause: result.error,
      });
    }

    try {
      await this.storage.replaceAll(result.data.data);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError("The backup could not be restored.", {
        cause: error,
      });
    }
  }
}

export function createBackupFilename(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 16).replace("T", "-").replace(/:/g, "-");
  return `alios-backup-${stamp}.json`;
}
