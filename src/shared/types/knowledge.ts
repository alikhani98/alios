import { z } from "zod";

import { KNOWLEDGE_ITEM_TYPE_VALUES } from "@/shared/constants/domain";
import { isoDateTimeSchema } from "@/shared/utils/domain";

export const knowledgeItemTypeSchema = z.enum(KNOWLEDGE_ITEM_TYPE_VALUES);

export const knowledgeItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  type: knowledgeItemTypeSchema,
  summary: z.string().optional(),
  content: z.string().min(1),
  source: z.string().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type KnowledgeItemType = z.infer<typeof knowledgeItemTypeSchema>;
export type KnowledgeItem = z.infer<typeof knowledgeItemSchema>;
