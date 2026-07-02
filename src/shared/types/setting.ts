import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const settingSchema = z.object({
  id: z.string().min(1),
  key: z.string().trim().min(1),
  value: z.unknown(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Setting = z.infer<typeof settingSchema>;
