import { z } from "zod";

import {
  LEVEL_3_VALUES,
  SMOKING_STATUS_VALUES,
  STRESS_LEVEL_VALUES,
} from "@/shared/constants/domain";
import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const level3Schema = z.enum(LEVEL_3_VALUES);
export const stressLevelSchema = z.enum(STRESS_LEVEL_VALUES);
export const smokingStatusSchema = z.enum(SMOKING_STATUS_VALUES);

export const dailyCheckinSchema = z.object({
  id: z.string().min(1),
  date: dateOnlySchema,
  sleepQuality: level3Schema,
  energyLevel: level3Schema,
  moodLevel: level3Schema,
  stressLevel: stressLevelSchema,
  medicationDone: z.boolean(),
  smokingStatus: smokingStatusSchema,
  mitTaskId: z.string().min(1).optional(),
  notes: z.string().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Level3 = z.infer<typeof level3Schema>;
export type StressLevel = z.infer<typeof stressLevelSchema>;
export type SmokingStatus = z.infer<typeof smokingStatusSchema>;
export type DailyCheckin = z.infer<typeof dailyCheckinSchema>;
