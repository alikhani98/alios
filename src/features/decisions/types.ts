import { z } from "zod";

import { decisionLogStatusSchema } from "@/shared/types";
import { dateOnlySchema } from "@/shared/utils";

const optionalTextSchema = z.string().default("");

export const decisionLogFormSchema = z.object({
  title: z.string().trim().min(1),
  decisionDate: dateOnlySchema,
  status: decisionLogStatusSchema,
  category: optionalTextSchema,
  context: z.string().trim().min(1),
  optionsText: optionalTextSchema,
  chosenOption: optionalTextSchema,
  reasoning: optionalTextSchema,
  expectedOutcome: optionalTextSchema,
  reviewDate: optionalTextSchema,
  confidence: optionalTextSchema,
  importance: optionalTextSchema,
  tagsText: optionalTextSchema,
  actualOutcome: optionalTextSchema,
  lesson: optionalTextSchema,
});

export type DecisionLogFormValues = z.infer<typeof decisionLogFormSchema>;
