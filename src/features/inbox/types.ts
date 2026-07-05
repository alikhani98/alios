import { z } from "zod";

import { inboxItemTypeSchema } from "@/shared/types";

export const inboxFormSchema = z.object({
  content: z.string().trim().min(1),
  type: inboxItemTypeSchema,
});

export type InboxFormValues = z.infer<typeof inboxFormSchema>;
