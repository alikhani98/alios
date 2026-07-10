import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const decisionLogStatusValues = [
  "open",
  "decided",
  "reviewed",
  "archived",
] as const;

export const decisionLogStatusSchema = z.enum(decisionLogStatusValues);

export const decisionConfidenceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const decisionImportanceSchema = decisionConfidenceSchema;

export const decisionLogEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  decisionDate: dateOnlySchema,
  status: decisionLogStatusSchema.default("open"),
  category: z.string().trim().min(1).optional(),
  context: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).default([]),
  chosenOption: z.string().trim().min(1).optional(),
  reasoning: z.string().trim().min(1).optional(),
  expectedOutcome: z.string().trim().min(1).optional(),
  reviewDate: dateOnlySchema.optional(),
  actualOutcome: z.string().trim().min(1).optional(),
  lesson: z.string().trim().min(1).optional(),
  confidence: decisionConfidenceSchema.optional(),
  importance: decisionImportanceSchema.optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DecisionLogStatus = z.infer<typeof decisionLogStatusSchema>;
export type DecisionConfidence = z.infer<typeof decisionConfidenceSchema>;
export type DecisionImportance = z.infer<typeof decisionImportanceSchema>;
export type DecisionLogEntry = z.infer<typeof decisionLogEntrySchema>;
