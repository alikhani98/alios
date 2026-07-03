import { z } from "zod";

import { projectSchema } from "@/shared/types";
import { dateOnlySchema } from "@/shared/utils";

export const projectFormSchema = projectSchema
  .pick({
    title: true,
    description: true,
    status: true,
    priority: true,
    nextAction: true,
    reviewDate: true,
  })
  .extend({
    description: z.string().optional(),
    nextAction: z.string().optional(),
    reviewDate: z.union([dateOnlySchema, z.literal("")]).optional(),
  })
  .refine(({ status }) => status !== "archived", {
    message: "Archiving is not available in this stage.",
    path: ["status"],
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
