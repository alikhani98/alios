import type { InboxItem } from "@/shared/types";

export function selectVisibleInboxItemIds(items: InboxItem[]): string[] {
  return items.map((item) => item.id);
}
