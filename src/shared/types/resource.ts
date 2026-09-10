import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const resourceTypeSchema = z.enum([
  "book",
  "website",
  "course",
  "document",
  "video",
]);

export const resourceStatusSchema = z.enum([
  "unread",
  "in_progress",
  "completed",
  "archived",
]);

export const resourceFormatSchema = z.enum([
  "physical",
  "digital",
  "online",
  "audio",
  "video",
  "other",
]);

export function getResourceProgressIssue(
  status: ResourceStatus | undefined,
  progressPercent: number | undefined
): string | undefined {
  if (progressPercent === undefined) {
    return undefined;
  }

  if (status === "unread" && progressPercent !== 0) {
    return "Unread resources must have 0% progress.";
  }

  if (
    status === "in_progress" &&
    (progressPercent < 1 || progressPercent > 99)
  ) {
    return "In-progress resources must have between 1% and 99% progress.";
  }

  if (status === "completed" && progressPercent !== 100) {
    return "Completed resources must have 100% progress.";
  }

  return undefined;
}

export const resourceSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1),
    type: resourceTypeSchema,
    description: z.string().optional(),
    source: z.string().optional(),
    url: z.string().optional(),
    author: z.string().trim().min(1).optional(),
    format: resourceFormatSchema.optional(),
    location: z.string().trim().min(1).optional(),
    startedAt: dateOnlySchema.optional(),
    completedAt: dateOnlySchema.optional(),
    status: resourceStatusSchema.optional(),
    progressPercent: z.number().int().min(0).max(100).optional(),
    goalId: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    taskId: z.string().min(1).optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .superRefine((resource, context) => {
    const issue = getResourceProgressIssue(
      resource.status,
      resource.progressPercent
    );
    if (issue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["progressPercent"],
        message: issue,
      });
    }
  });

export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;
export type ResourceFormat = z.infer<typeof resourceFormatSchema>;
export type Resource = z.infer<typeof resourceSchema>;
