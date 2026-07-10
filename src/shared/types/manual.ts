import { z } from "zod";

import {
  MANUAL_CATEGORY_VALUES,
  MANUAL_IMPORTANCE_VALUES,
  MANUAL_STATUS_VALUES,
} from "@/shared/constants/domain";
import { isoDateTimeSchema } from "@/shared/utils/domain";

export const manualEntryCategorySchema = z.enum(MANUAL_CATEGORY_VALUES);
export const manualEntryImportanceSchema = z.enum(MANUAL_IMPORTANCE_VALUES);
export const manualEntryStatusSchema = z.enum(MANUAL_STATUS_VALUES);

export const manualEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  category: manualEntryCategorySchema,
  importance: manualEntryImportanceSchema,
  status: manualEntryStatusSchema.default("active"),
  tags: z.array(z.string().trim().min(1)).default([]),
  reviewIntervalDays: z.number().int().positive().optional(),
  lastReviewedAt: isoDateTimeSchema.optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type ManualEntryCategory = z.infer<typeof manualEntryCategorySchema>;
export type ManualEntryImportance = z.infer<typeof manualEntryImportanceSchema>;
export type ManualEntryStatus = z.infer<typeof manualEntryStatusSchema>;
export type ManualEntry = z.infer<typeof manualEntrySchema>;
