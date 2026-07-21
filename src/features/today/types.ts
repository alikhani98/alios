import { z } from "zod";

import { dailyCheckinSchema, taskBaseSchema } from "@/shared/types";

export const todayTaskFormSchema = taskBaseSchema
  .pick({
    title: true,
    description: true,
    status: true,
    priority: true,
    isMit: true,
    dueDate: true,
  })
  .extend({
    description: z.string().optional(),
    projectId: z.union([z.string().min(1), z.literal("")]).optional(),
    recurrenceFrequency: z.enum(["none", "daily", "weekly"]).default("none"),
  });

export type TodayTaskFormValues = z.infer<typeof todayTaskFormSchema>;

export const dailyCheckinFormSchema = dailyCheckinSchema
  .pick({
    sleepQuality: true,
    energyLevel: true,
    moodLevel: true,
    stressLevel: true,
    medicationDone: true,
    smokingStatus: true,
    notes: true,
  })
  .extend({ notes: z.string().optional() });

export type DailyCheckinFormValues = z.infer<typeof dailyCheckinFormSchema>;
