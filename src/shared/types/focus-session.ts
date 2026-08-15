import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils";

export const focusSessionModeSchema = z.enum(["pomodoro", "free"]);

export const focusSessionSchema = z.object({
  id: z.string().min(1),
  startedAt: isoDateTimeSchema,
  durationMinutes: z.number().min(0).max(180),
  mode: focusSessionModeSchema,
  taskId: z.string().min(1).optional(),
  completedAt: isoDateTimeSchema.optional(),
  interrupted: z.boolean(),
});

export type FocusSessionMode = z.infer<typeof focusSessionModeSchema>;
export type FocusSession = z.infer<typeof focusSessionSchema>;
