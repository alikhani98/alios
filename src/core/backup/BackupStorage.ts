import type { AliosBackupData } from "./types";

export type LocalDataSummary = {
  dailyCheckins: number;
  tasks: number;
  financeTransactions: number;
  financeObligations: number;
  projects: number;
  journalEntries: number;
  knowledgeItems: number;
  settings: number;
  inboxItems: number;
};

export interface BackupStorage {
  readAll(): Promise<AliosBackupData>;
  replaceAll(data: AliosBackupData): Promise<void>;
  getSummary(): Promise<LocalDataSummary>;
  clearAll(): Promise<void>;
}
