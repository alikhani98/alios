import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, {
  message: "Expected a time in HH:mm format",
});

export const urgeActionSchema = z.enum(["resisted", "delayed", "acted"]);

export const urgeEntrySchema = z.object({
  id: z.string().min(1),
  date: dateOnlySchema,
  time: timeOfDaySchema,
  urgeType: z.string().min(1),
  intensity: z.number().int().min(1).max(10),
  feeling: z.string().min(1),
  action: urgeActionSchema,
  delayedTenMin: z.boolean(),
  note: z.string().optional(),
  createdAt: isoDateTimeSchema,
});

export type UrgeAction = z.infer<typeof urgeActionSchema>;
export type UrgeEntry = z.infer<typeof urgeEntrySchema>;
