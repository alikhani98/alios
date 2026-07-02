import { z } from "zod";

import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "@/shared/constants/domain";
import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const taskStatusSchema = z.enum(TASK_STATUS_VALUES);
export const taskPrioritySchema = z.enum(TASK_PRIORITY_VALUES);

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: dateOnlySchema.optional(),
  isMit: z.boolean(),
  projectId: z.string().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type Task = z.infer<typeof taskSchema>;
