import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const resourceTypeSchema = z.enum([
  "book",
  "website",
  "course",
  "document",
  "video",
]);

export const resourceStatusSchema = z.enum([
  "unread",
  "in_progress",
  "completed",
  "archived",
]);

export const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  type: resourceTypeSchema,
  description: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  status: resourceStatusSchema.optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  goalId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;
export type Resource = z.infer<typeof resourceSchema>;
