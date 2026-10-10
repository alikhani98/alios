import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const therapyNoteCategorySchema = z.enum([
  "event",
  "feeling",
  "pattern",
  "question",
  "insight",
]);

export const therapyNoteSchema = z.object({
  id: z.string().min(1),
  date: dateOnlySchema,
  category: therapyNoteCategorySchema,
  content: z.string().trim().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type TherapyNoteCategory = z.infer<typeof therapyNoteCategorySchema>;
export type TherapyNote = z.infer<typeof therapyNoteSchema>;
