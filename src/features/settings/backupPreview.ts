import type { AliosBackup, AliosBackupData } from "@/core/backup";

export const BACKUP_TABLE_KEYS = [
  "dailyCheckins",
  "tasks",
  "decisionLogEntries",
  "manualEntries",
  "financeTransactions",
  "financeObligations",
  "projects",
  "journalEntries",
  "knowledgeItems",
  "settings",
  "inboxItems",
] as const satisfies readonly (keyof AliosBackupData)[];

export type BackupTableKey = (typeof BACKUP_TABLE_KEYS)[number];

export type BackupTableCount = {
  key: BackupTableKey;
  count: number;
};

export type BackupPreview = {
  backupVersion: AliosBackup["backupVersion"];
  exportedAt: AliosBackup["exportedAt"];
  totalRecords: number;
  tableCounts: BackupTableCount[];
};

export function createBackupPreview(backup: AliosBackup): BackupPreview {
  const tableCounts = BACKUP_TABLE_KEYS.map((key) => ({
    key,
    count: backup.data[key].length,
  }));

  return {
    backupVersion: backup.backupVersion,
    exportedAt: backup.exportedAt,
    totalRecords: tableCounts.reduce((total, table) => total + table.count, 0),
    tableCounts,
  };
}
