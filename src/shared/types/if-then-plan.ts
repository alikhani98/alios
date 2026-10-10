import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const ifThenPlanSchema = z.object({
  id: z.string().min(1),
  ifTrigger: z.string().trim().min(1),
  thenAction: z.string().trim().min(1),
  isActive: z.boolean(),
  linkedUrgeType: z.string().trim().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type IfThenPlan = z.infer<typeof ifThenPlanSchema>;
