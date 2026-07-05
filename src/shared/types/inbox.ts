import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const INBOX_ITEM_TYPE_VALUES = [
  "note",
  "task",
  "idea",
  "link",
  "other",
] as const;
export const INBOX_ITEM_STATUS_VALUES = ["unprocessed", "processed"] as const;

export const inboxItemTypeSchema = z.enum(INBOX_ITEM_TYPE_VALUES);
export const inboxItemStatusSchema = z.enum(INBOX_ITEM_STATUS_VALUES);

export const inboxItemSchema = z.object({
  id: z.string().min(1),
  content: z.string().trim().min(1),
  type: inboxItemTypeSchema,
  status: inboxItemStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type InboxItemType = z.infer<typeof inboxItemTypeSchema>;
export type InboxItemStatus = z.infer<typeof inboxItemStatusSchema>;
export type InboxItem = z.infer<typeof inboxItemSchema>;
