import type { TranslationKey } from "@/shared/i18n";
import type { InboxItemStatus, InboxItemType } from "@/shared/types";

export const INBOX_TYPE_LABEL_KEYS: Record<InboxItemType, TranslationKey> = {
  note: "inbox.typeNote",
  task: "inbox.typeTask",
  idea: "inbox.typeIdea",
  link: "inbox.typeLink",
  other: "inbox.typeOther",
};

export const INBOX_STATUS_LABEL_KEYS: Record<InboxItemStatus, TranslationKey> = {
  unprocessed: "inbox.unprocessed",
  processed: "inbox.processed",
};
