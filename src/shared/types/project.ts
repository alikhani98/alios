import { z } from "zod";

import {
  PROJECT_PRIORITY_VALUES,
  PROJECT_STATUS_VALUES,
} from "@/shared/constants/domain";
import { recordSyncMetadataSchema } from "@/shared/types/sync";
import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const projectStatusSchema = z.enum(PROJECT_STATUS_VALUES);
export const projectPrioritySchema = z.enum(PROJECT_PRIORITY_VALUES);

export const projectMilestoneSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  done: z.boolean().default(false),
  date: dateOnlySchema.optional(),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  status: projectStatusSchema,
  priority: projectPrioritySchema,
  goalId: z.string().min(1).optional(),
  nextAction: z.string().optional(),
  reviewDate: dateOnlySchema.optional(),
  reviewIntervalDays: z.number().int().positive().optional(),
  lastReviewedAt: isoDateTimeSchema.optional(),
  milestones: z.array(projectMilestoneSchema).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  archivedAt: isoDateTimeSchema.optional(),
  sync: recordSyncMetadataSchema.optional(),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectPriority = z.infer<typeof projectPrioritySchema>;
export type ProjectMilestone = z.infer<typeof projectMilestoneSchema>;
export type Project = z.infer<typeof projectSchema>;
