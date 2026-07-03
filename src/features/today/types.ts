import { z } from "zod";

import { dailyCheckinSchema, taskSchema } from "@/shared/types";

export const todayTaskFormSchema = taskSchema
  .pick({
    title: true,
    description: true,
    status: true,
    priority: true,
    isMit: true,
  })
  .extend({ description: z.string().optional() });

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
