import { z } from "zod";

import {
  dailyCheckinSchema,
  dailyCommitmentSchema,
  decisionLogEntrySchema,
  experimentLogSchema,
  experimentSchema,
  goalSchema,
  financeCategoryBudgetSchema,
  financeAssetSchema,
  financeObligationSchema,
  financeTransactionSchema,
  focusSessionSchema,
  ifThenPlanSchema,
  journalEntrySchema,
  lifeAreaSchema,
  inboxItemSchema,
  manualEntrySchema,
  therapyNoteSchema,
  knowledgeItemSchema,
  resourceSchema,
  projectSchema,
  settingSchema,
  taskSchema,
  routineSchema,
  urgeEntrySchema,
  weeklyPlanSchema,
  attachmentSchema,
} from "@/shared/types";
import { isoDateTimeSchema } from "@/shared/utils";

export const ALIOS_BACKUP_APP = "AliOS" as const;
export const ALIOS_BACKUP_VERSION = 1 as const;

export const aliosBackupDataSchema = z.object({
  dailyCheckins: z.array(dailyCheckinSchema),
  dailyCommitments: z.array(dailyCommitmentSchema).default([]),
  urgeEntries: z.array(urgeEntrySchema).default([]),
  tasks: z.array(taskSchema),
  goals: z.array(goalSchema).default([]),
  lifeAreas: z.array(lifeAreaSchema).default([]),
  decisionLogEntries: z.array(decisionLogEntrySchema).default([]),
  experiments: z.array(experimentSchema).default([]),
  experimentLogs: z.array(experimentLogSchema).default([]),
  ifThenPlans: z.array(ifThenPlanSchema).default([]),
  therapyNotes: z.array(therapyNoteSchema).default([]),
  manualEntries: z.array(manualEntrySchema).default([]),
  financeTransactions: z.array(financeTransactionSchema).default([]),
  financeObligations: z.array(financeObligationSchema).default([]),
  financeCategoryBudgets: z.array(financeCategoryBudgetSchema).default([]),
  financeAssets: z.array(financeAssetSchema).default([]),
  focusSessions: z.array(focusSessionSchema).default([]),
  projects: z.array(projectSchema),
  journalEntries: z.array(journalEntrySchema),
  knowledgeItems: z.array(knowledgeItemSchema),
  resources: z.array(resourceSchema).default([]),
  settings: z.array(settingSchema),
  inboxItems: z.array(inboxItemSchema).default([]),
  routines: z.array(routineSchema).default([]),
  weeklyPlans: z.array(weeklyPlanSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
});

export const aliosBackupSchema = z.object({
  app: z.literal(ALIOS_BACKUP_APP),
  backupVersion: z.literal(ALIOS_BACKUP_VERSION),
  exportedAt: isoDateTimeSchema,
  data: aliosBackupDataSchema,
});

export type AliosBackupData = z.infer<typeof aliosBackupDataSchema>;
export type AliosBackup = z.infer<typeof aliosBackupSchema> & {
  /**
   * Runtime-only marker. It is non-enumerable and never enters the JSON file.
   * It preserves the distinction between old backups without attachments and
   * current backups that intentionally contain an empty attachment array.
   */
  readonly attachmentMetadataIncluded?: boolean;
};
