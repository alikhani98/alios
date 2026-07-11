import { z } from "zod";

import {
  dailyCheckinSchema,
  decisionLogEntrySchema,
  goalSchema,
  financeObligationSchema,
  financeTransactionSchema,
  journalEntrySchema,
  lifeAreaSchema,
  inboxItemSchema,
  manualEntrySchema,
  knowledgeItemSchema,
  projectSchema,
  settingSchema,
  taskSchema,
} from "@/shared/types";
import { isoDateTimeSchema } from "@/shared/utils";

export const ALIOS_BACKUP_APP = "AliOS" as const;
export const ALIOS_BACKUP_VERSION = 1 as const;

export const aliosBackupDataSchema = z.object({
  dailyCheckins: z.array(dailyCheckinSchema),
  tasks: z.array(taskSchema),
  goals: z.array(goalSchema).default([]),
  lifeAreas: z.array(lifeAreaSchema).default([]),
  decisionLogEntries: z.array(decisionLogEntrySchema).default([]),
  manualEntries: z.array(manualEntrySchema).default([]),
  financeTransactions: z.array(financeTransactionSchema).default([]),
  financeObligations: z.array(financeObligationSchema).default([]),
  projects: z.array(projectSchema),
  journalEntries: z.array(journalEntrySchema),
  knowledgeItems: z.array(knowledgeItemSchema),
  settings: z.array(settingSchema),
  inboxItems: z.array(inboxItemSchema).default([]),
});

export const aliosBackupSchema = z.object({
  app: z.literal(ALIOS_BACKUP_APP),
  backupVersion: z.literal(ALIOS_BACKUP_VERSION),
  exportedAt: isoDateTimeSchema,
  data: aliosBackupDataSchema,
});

export type AliosBackupData = z.infer<typeof aliosBackupDataSchema>;
export type AliosBackup = z.infer<typeof aliosBackupSchema>;
