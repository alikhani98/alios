import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const experimentStatusSchema = z.enum([
  "active",
  "completed",
  "cancelled",
]);

export const experimentSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  ifCondition: z.string().trim().min(1),
  thenHypothesis: z.string().trim().min(1),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  status: experimentStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const experimentLogSchema = z.object({
  id: z.string().min(1),
  experimentId: z.string().min(1),
  date: dateOnlySchema,
  conditionMet: z.boolean(),
  hypothesisResult: z.boolean(),
  note: z.string().optional(),
  createdAt: isoDateTimeSchema,
});

export type ExperimentStatus = z.infer<typeof experimentStatusSchema>;
export type Experiment = z.infer<typeof experimentSchema>;
export type ExperimentLog = z.infer<typeof experimentLogSchema>;
