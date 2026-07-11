import { z } from "zod";

import { GOAL_AREA_VALUES } from "@/shared/constants/domain";
import { isoDateTimeSchema } from "@/shared/utils/domain";

export const lifeAreaKeySchema = z.enum(GOAL_AREA_VALUES);
export const lifeAreaStatusSchema = z.enum(["active", "paused", "archived"]);
export const lifeAreaAttentionLevelSchema = z.enum(["low", "medium", "high"]);

export const lifeAreaSchema = z.object({
  id: z.string().min(1),
  areaKey: lifeAreaKeySchema,
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  status: lifeAreaStatusSchema.default("active"),
  attentionLevel: lifeAreaAttentionLevelSchema.default("medium"),
  satisfactionScore: z.number().int().min(1).max(5).optional(),
  focusNote: z.string().trim().default(""),
  reviewIntervalDays: z.number().int().positive().optional(),
  lastReviewedAt: isoDateTimeSchema.optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type LifeAreaKey = z.infer<typeof lifeAreaKeySchema>;
export type LifeAreaStatus = z.infer<typeof lifeAreaStatusSchema>;
export type LifeAreaAttentionLevel = z.infer<
  typeof lifeAreaAttentionLevelSchema
>;
export type LifeArea = z.infer<typeof lifeAreaSchema>;
