import { z } from "zod";

import { JOURNAL_ENTRY_TYPE_VALUES } from "@/shared/constants/domain";
import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";
import { level3Schema } from "./daily-checkin";

export const journalEntryTypeSchema = z.enum(JOURNAL_ENTRY_TYPE_VALUES);

export const journalEntrySchema = z.object({
  id: z.string().min(1),
  date: dateOnlySchema,
  type: journalEntryTypeSchema,
  title: z.string().trim().min(1),
  content: z.string().min(1),
  moodLevel: level3Schema.optional(),
  energyLevel: level3Schema.optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type JournalEntryType = z.infer<typeof journalEntryTypeSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
