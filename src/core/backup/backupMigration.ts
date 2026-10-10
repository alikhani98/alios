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
  inboxItemSchema,
  journalEntrySchema,
  lifeAreaSchema,
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

import {
  ALIOS_BACKUP_APP,
  ALIOS_BACKUP_VERSION,
  aliosBackupSchema,
  type AliosBackup,
  type AliosBackupData,
} from "./types";

export const backupDataInputSchema = z.object({
  dailyCheckins: z.array(dailyCheckinSchema).optional(),
  dailyCommitments: z.array(dailyCommitmentSchema).optional(),
  urgeEntries: z.array(urgeEntrySchema).optional(),
  tasks: z.array(taskSchema).optional(),
  goals: z.array(goalSchema).optional(),
  lifeAreas: z.array(lifeAreaSchema).optional(),
  decisionLogEntries: z.array(decisionLogEntrySchema).optional(),
  experiments: z.array(experimentSchema).optional(),
  experimentLogs: z.array(experimentLogSchema).optional(),
  ifThenPlans: z.array(ifThenPlanSchema).optional(),
  therapyNotes: z.array(therapyNoteSchema).optional(),
  manualEntries: z.array(manualEntrySchema).optional(),
  financeTransactions: z.array(financeTransactionSchema).optional(),
  financeObligations: z.array(financeObligationSchema).optional(),
  financeCategoryBudgets: z.array(financeCategoryBudgetSchema).optional(),
  financeAssets: z.array(financeAssetSchema).optional(),
  focusSessions: z.array(focusSessionSchema).optional(),
  projects: z.array(projectSchema).optional(),
  journalEntries: z.array(journalEntrySchema).optional(),
  knowledgeItems: z.array(knowledgeItemSchema).optional(),
  resources: z.array(resourceSchema).optional(),
  settings: z.array(settingSchema).optional(),
  inboxItems: z.array(inboxItemSchema).optional(),
  routines: z.array(routineSchema).optional(),
  weeklyPlans: z.array(weeklyPlanSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export type BackupDataInput = z.infer<typeof backupDataInputSchema>;

function cloneRecords<T>(records: readonly T[] | undefined): T[] {
  return [...(records ?? [])];
}

export function normalizeBackupData(data: BackupDataInput): AliosBackupData {
  return {
    dailyCheckins: cloneRecords(data.dailyCheckins),
    dailyCommitments: cloneRecords(data.dailyCommitments),
    urgeEntries: cloneRecords(data.urgeEntries),
    tasks: cloneRecords(data.tasks),
    goals: cloneRecords(data.goals),
    lifeAreas: cloneRecords(data.lifeAreas),
    decisionLogEntries: cloneRecords(data.decisionLogEntries),
    experiments: cloneRecords(data.experiments),
    experimentLogs: cloneRecords(data.experimentLogs),
    ifThenPlans: cloneRecords(data.ifThenPlans),
    therapyNotes: cloneRecords(data.therapyNotes),
    manualEntries: cloneRecords(data.manualEntries),
    financeTransactions: cloneRecords(data.financeTransactions),
    financeObligations: cloneRecords(data.financeObligations),
    financeCategoryBudgets: cloneRecords(data.financeCategoryBudgets),
    financeAssets: cloneRecords(data.financeAssets),
    focusSessions: cloneRecords(data.focusSessions),
    projects: cloneRecords(data.projects),
    journalEntries: cloneRecords(data.journalEntries),
    knowledgeItems: cloneRecords(data.knowledgeItems),
    resources: cloneRecords(data.resources),
    settings: cloneRecords(data.settings),
    inboxItems: cloneRecords(data.inboxItems),
    routines: cloneRecords(data.routines),
    weeklyPlans: cloneRecords(data.weeklyPlans),
    attachments: cloneRecords(data.attachments),
  };
}

type BackupPayloadInput = {
  app: typeof ALIOS_BACKUP_APP;
  backupVersion: typeof ALIOS_BACKUP_VERSION;
  exportedAt: string;
  data: BackupDataInput;
};

export function migrateBackupPayload(payload: BackupPayloadInput): AliosBackup {
  const backup = aliosBackupSchema.parse({
    app: payload.app,
    backupVersion: payload.backupVersion,
    exportedAt: payload.exportedAt,
    data: normalizeBackupData(payload.data),
  });

  Object.defineProperty(backup, "attachmentMetadataIncluded", {
    configurable: true,
    enumerable: false,
    value: Object.prototype.hasOwnProperty.call(payload.data, "attachments"),
  });

  return backup;
}
