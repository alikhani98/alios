import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const attachmentOwnerTypeSchema = z.enum(["resource", "knowledge"]);

export const attachmentKindSchema = z.enum([
  "document",
  "image",
  "audio",
  "cover",
  "other",
]);

export const attachmentSchema = z.object({
  id: z.string().min(1),
  ownerType: attachmentOwnerTypeSchema,
  ownerId: z.string().min(1),
  kind: attachmentKindSchema,
  filename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  size: z.number().int().nonnegative(),
  storageKey: z.string().trim().min(1),
  checksum: z.string().trim().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type AttachmentOwnerType = z.infer<typeof attachmentOwnerTypeSchema>;
export type AttachmentKind = z.infer<typeof attachmentKindSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
