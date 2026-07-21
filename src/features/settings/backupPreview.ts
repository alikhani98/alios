import type { AliosBackup, AliosBackupData, LocalDataSummary } from "@/core/backup";

export const BACKUP_TABLE_KEYS = [
  "dailyCheckins",
  "tasks",
  "goals",
  "lifeAreas",
  "decisionLogEntries",
  "manualEntries",
  "financeTransactions",
  "financeObligations",
  "projects",
  "journalEntries",
  "knowledgeItems",
  "settings",
  "inboxItems",
  "routines",
  "weeklyPlans",
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

export type BackupRestoreImpact = {
  key: BackupTableKey;
  currentCount: number;
  backupCount: number;
  difference: number;
};

export type BackupRestoreImpactPreview = {
  currentTotalRecords: number;
  backupTotalRecords: number;
  difference: number;
  changedTableCount: number;
  tableImpacts: BackupRestoreImpact[];
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

export function createBackupRestoreImpactPreview(
  backup: AliosBackup,
  currentData: LocalDataSummary
): BackupRestoreImpactPreview {
  const tableImpacts = BACKUP_TABLE_KEYS.map((key) => {
    const currentCount = currentData[key];
    const backupCount = backup.data[key].length;

    return {
      key,
      currentCount,
      backupCount,
      difference: backupCount - currentCount,
    };
  });
  const currentTotalRecords = tableImpacts.reduce(
    (total, table) => total + table.currentCount,
    0
  );
  const backupTotalRecords = tableImpacts.reduce(
    (total, table) => total + table.backupCount,
    0
  );

  return {
    currentTotalRecords,
    backupTotalRecords,
    difference: backupTotalRecords - currentTotalRecords,
    changedTableCount: tableImpacts.filter((table) => table.difference !== 0).length,
    tableImpacts,
  };
}
