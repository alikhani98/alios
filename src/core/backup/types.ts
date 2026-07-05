import { z } from "zod";

import {
  dailyCheckinSchema,
  journalEntrySchema,
  inboxItemSchema,
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
