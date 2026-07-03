import { z } from "zod";

import { knowledgeItemSchema } from "@/shared/types";

export const knowledgeItemFormSchema = knowledgeItemSchema
  .pick({
    title: true,
    type: true,
    summary: true,
    content: true,
    source: true,
  })
  .extend({
    summary: z.string().optional(),
    source: z.string().optional(),
  });

export type KnowledgeItemFormValues = z.infer<typeof knowledgeItemFormSchema>;
