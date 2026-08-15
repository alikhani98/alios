import { z } from "zod";

import { knowledgeItemSchema } from "@/shared/types";

export const knowledgeItemFormSchema = knowledgeItemSchema
  .pick({
    title: true,
    type: true,
    summary: true,
    content: true,
    source: true,
    projectId: true,
    goalId: true,
  })
  .extend({
    summary: z.string().optional(),
    source: z.string().optional(),
    projectId: z.union([z.string().min(1), z.literal("")]).optional(),
    goalId: z.union([z.string().min(1), z.literal("")]).optional(),
  });

export type KnowledgeItemFormValues = z.infer<typeof knowledgeItemFormSchema>;
