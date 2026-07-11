import { z } from "zod";

import {
  dailyCheckinSchema,
  decisionLogEntrySchema,
  goalSchema,
  financeObligationSchema,
  financeTransactionSchema,
  inboxItemSchema,
  journalEntrySchema,
  manualEntrySchema,
  knowledgeItemSchema,
  projectSchema,
  settingSchema,
  taskSchema,
} from "@/shared/types";

import {
  ALIOS_BACKUP_APP,
  ALIOS_BACKUP_VERSION,
  aliosBackupSchema,
  type AliosBackup,
  type AliosBackupData,
} from "./types";

export const backupDataInputSchema = z.object({
  dailyCheckins: z.array(dailyCheckinSchema).optional(),
  tasks: z.array(taskSchema).optional(),
  goals: z.array(goalSchema).optional(),
  decisionLogEntries: z.array(decisionLogEntrySchema).optional(),
  manualEntries: z.array(manualEntrySchema).optional(),
  financeTransactions: z.array(financeTransactionSchema).optional(),
  financeObligations: z.array(financeObligationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  journalEntries: z.array(journalEntrySchema).optional(),
  knowledgeItems: z.array(knowledgeItemSchema).optional(),
  settings: z.array(settingSchema).optional(),
  inboxItems: z.array(inboxItemSchema).optional(),
});

export type BackupDataInput = z.infer<typeof backupDataInputSchema>;

function cloneRecords<T>(records: readonly T[] | undefined): T[] {
  return [...(records ?? [])];
}

export function normalizeBackupData(data: BackupDataInput): AliosBackupData {
  return {
    dailyCheckins: cloneRecords(data.dailyCheckins),
    tasks: cloneRecords(data.tasks),
    goals: cloneRecords(data.goals),
    decisionLogEntries: cloneRecords(data.decisionLogEntries),
    manualEntries: cloneRecords(data.manualEntries),
    financeTransactions: cloneRecords(data.financeTransactions),
    financeObligations: cloneRecords(data.financeObligations),
    projects: cloneRecords(data.projects),
    journalEntries: cloneRecords(data.journalEntries),
    knowledgeItems: cloneRecords(data.knowledgeItems),
    settings: cloneRecords(data.settings),
    inboxItems: cloneRecords(data.inboxItems),
  };
}

type BackupPayloadInput = {
  app: typeof ALIOS_BACKUP_APP;
  backupVersion: typeof ALIOS_BACKUP_VERSION;
  exportedAt: string;
  data: BackupDataInput;
};

export function migrateBackupPayload(payload: BackupPayloadInput): AliosBackup {
  return aliosBackupSchema.parse({
    app: payload.app,
    backupVersion: payload.backupVersion,
    exportedAt: payload.exportedAt,
    data: normalizeBackupData(payload.data),
  });
}
