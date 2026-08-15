import { z } from "zod";

import { journalEntrySchema, level3Schema } from "@/shared/types";

export const journalEntryFormSchema = journalEntrySchema
  .pick({
    date: true,
    type: true,
    title: true,
    content: true,
    projectId: true,
    goalId: true,
    moodLevel: true,
    energyLevel: true,
  })
  .extend({
    projectId: z.union([z.string().min(1), z.literal("")]).optional(),
    goalId: z.union([z.string().min(1), z.literal("")]).optional(),
    moodLevel: z.union([level3Schema, z.literal("")]).optional(),
    energyLevel: z.union([level3Schema, z.literal("")]).optional(),
  });

export type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;
