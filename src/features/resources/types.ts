import { z } from "zod";

import { resourceStatusSchema, resourceTypeSchema } from "@/shared/types";

export const resourceFormSchema = z.object({
  title: z.string().trim().min(1),
  type: resourceTypeSchema,
  description: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  status: resourceStatusSchema,
  progressPercent: z.string().optional(),
});

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;
