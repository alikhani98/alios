import { z } from "zod";

import {
  TASK_PRIORITY_VALUES,
  TASK_RECURRENCE_FREQUENCY_VALUES,
  TASK_STATUS_VALUES,
} from "@/shared/constants/domain";
import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const taskStatusSchema = z.enum(TASK_STATUS_VALUES);
export const taskPrioritySchema = z.enum(TASK_PRIORITY_VALUES);
export const taskRecurrenceFrequencySchema = z.enum(TASK_RECURRENCE_FREQUENCY_VALUES);
export const taskRecurrenceSchema = z.object({
  frequency: taskRecurrenceFrequencySchema,
});

export const taskBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: dateOnlySchema.optional(),
  isMit: z.boolean(),
  projectId: z.string().min(1).optional(),
  routineId: z.string().min(1).optional(),
  recurrence: taskRecurrenceSchema.optional(),
  recurrenceSeriesId: z.string().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
});

export const taskSchema = taskBaseSchema.superRefine((task, ctx) => {
  if (task.routineId && task.recurrenceSeriesId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["routineId"],
      message: "A task cannot have both routineId and recurrenceSeriesId.",
    });
  }
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskRecurrenceFrequency = z.infer<typeof taskRecurrenceFrequencySchema>;
export type TaskRecurrence = z.infer<typeof taskRecurrenceSchema>;
export type Task = z.infer<typeof taskSchema>;
