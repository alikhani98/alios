import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, {
  message: "Expected a time in HH:mm format",
});

export const dailyCommitmentSchema = z.object({
  id: z.string().min(1),
  date: dateOnlySchema,
  title: z.string().min(1),
  plannedStartTime: timeOfDaySchema,
  minimumVersion: z.string(),
  didStart: z.boolean(),
  startedAt: isoDateTimeSchema.nullable().optional(),
  preStartFeeling: z.string().nullable().optional(),
  mainBlocker: z.string().nullable().optional(),
  endOfDayNote: z.string().nullable().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DailyCommitment = z.infer<typeof dailyCommitmentSchema>;
