import type { AliosBackupData } from "./types";

export type LocalDataSummary = {
  dailyCheckins: number;
  tasks: number;
  goals: number;
  lifeAreas: number;
  decisionLogEntries: number;
  manualEntries: number;
  financeTransactions: number;
  financeObligations: number;
  financeCategoryBudgets: number;
  financeAssets: number;
  focusSessions: number;
  projects: number;
  journalEntries: number;
  knowledgeItems: number;
  resources: number;
  settings: number;
  inboxItems: number;
  routines: number;
  weeklyPlans: number;
  attachments: number;
};

export type BackupRestoreOptions = {
  replaceAttachments?: boolean;
};

export interface BackupStorage {
  readAll(): Promise<AliosBackupData>;
  replaceAll(
    data: AliosBackupData,
    options?: BackupRestoreOptions
  ): Promise<void>;
  getSummary(): Promise<LocalDataSummary>;
  clearAll(): Promise<void>;
}
