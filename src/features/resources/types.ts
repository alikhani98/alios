import { z } from "zod";

import {
  getResourceProgressIssue,
  resourceFormatSchema,
  resourceStatusSchema,
  resourceTypeSchema,
} from "@/shared/types";
import { dateOnlySchema } from "@/shared/utils";

export const resourceFormSchema = z
  .object({
    title: z.string().trim().min(1),
    type: resourceTypeSchema,
    description: z.string().optional(),
    source: z.string().optional(),
    url: z.string().optional(),
    author: z.string().optional(),
    format: z.preprocess(
      (value) => (value === "" ? undefined : value),
      resourceFormatSchema.optional()
    ),
    location: z.string().optional(),
    startedAt: z.union([dateOnlySchema, z.literal("")]).optional(),
    completedAt: z.union([dateOnlySchema, z.literal("")]).optional(),
    status: resourceStatusSchema,
    progressPercent: z
      .string()
      .refine(
        (value) =>
          value.trim() === "" ||
          (/^\d+$/.test(value.trim()) &&
            Number.parseInt(value, 10) >= 0 &&
            Number.parseInt(value, 10) <= 100),
        "Progress must be a whole number from 0 to 100."
      )
      .optional(),
  })
  .superRefine((values, context) => {
    const progressValue = values.progressPercent?.trim();
    if (!progressValue) {
      return;
    }

    const issue = getResourceProgressIssue(
      values.status,
      Number.parseInt(progressValue, 10)
    );
    if (issue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["progressPercent"],
        message: issue,
      });
    }
  });

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;
