import { z } from "zod";

import { TASK_PRIORITY_VALUES } from "@/shared/constants/domain";
import { isoDateTimeSchema } from "@/shared/utils/domain";

export const routineWeekdaySchema = z.number().int().min(0).max(6);

export const routineSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  weekdays: z.array(routineWeekdaySchema).min(1),
  priority: z.enum(TASK_PRIORITY_VALUES),
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Routine = z.infer<typeof routineSchema>;
