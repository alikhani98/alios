import { z } from "zod";

import {
  GOAL_AREA_VALUES,
  GOAL_IMPORTANCE_VALUES,
  GOAL_STATUS_VALUES,
  GOAL_TIMEFRAME_VALUES,
} from "@/shared/constants/domain";
import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const goalAreaSchema = z.enum(GOAL_AREA_VALUES);
export const goalTimeframeSchema = z.enum(GOAL_TIMEFRAME_VALUES);
export const goalStatusSchema = z.enum(GOAL_STATUS_VALUES);
export const goalImportanceSchema = z.enum(GOAL_IMPORTANCE_VALUES);

export const goalSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  area: goalAreaSchema,
  timeframe: goalTimeframeSchema,
  status: goalStatusSchema.default("active"),
  importance: goalImportanceSchema,
  progressPercent: z.number().int().min(0).max(100).default(0),
  targetDate: dateOnlySchema.optional(),
  reviewIntervalDays: z.number().int().positive().optional(),
  lastReviewedAt: isoDateTimeSchema.optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type GoalArea = z.infer<typeof goalAreaSchema>;
export type GoalTimeframe = z.infer<typeof goalTimeframeSchema>;
export type GoalStatus = z.infer<typeof goalStatusSchema>;
export type GoalImportance = z.infer<typeof goalImportanceSchema>;
export type Goal = z.infer<typeof goalSchema>;
