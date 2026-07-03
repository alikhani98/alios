import type { AliosBackupData } from "./types";

export interface BackupStorage {
  readAll(): Promise<AliosBackupData>;
  replaceAll(data: AliosBackupData): Promise<void>;
}
