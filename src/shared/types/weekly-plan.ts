import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const weeklyPlanSchema = z.object({
  id: z.string().min(1),
  weekStart: dateOnlySchema,
  focusTitle: z.string().trim().min(1),
  intention: z.string().optional(),
  goalId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
