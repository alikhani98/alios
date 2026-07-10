import { StorageError, ValidationError } from "@/core/errors";
import type { BackupStorage } from "./BackupStorage";
import {
  BACKUP_ERROR_CODES,
  validateAndMigrateBackup,
} from "./backupValidation";
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
    return validateAndMigrateBackup(content);
  }

  async restoreBackup(backup: AliosBackup): Promise<void> {
    const result = aliosBackupSchema.safeParse(backup);
    if (!result.success) {
      throw new ValidationError("The backup data is not valid anymore.", {
        code: BACKUP_ERROR_CODES.invalidData,
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
