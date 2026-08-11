import type { InboxItem, InboxItemStatus, InboxItemType } from "@/shared/types";

export type InboxStatusFilter = InboxItemStatus | "all";
export type InboxTypeFilter = InboxItemType | "all";

export type InboxFilters = {
  query: string;
  status: InboxStatusFilter;
  type: InboxTypeFilter;
  today?: string;
};

export function isInboxItemSnoozed(item: InboxItem, today: string): boolean {
  return Boolean(item.snoozedUntil && item.snoozedUntil > today);
}

export function filterInboxItems(
  items: InboxItem[],
  filters: InboxFilters
): InboxItem[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return items.filter((item) => {
    if (filters.today && isInboxItemSnoozed(item, filters.today)) {
      return false;
    }

    const matchesQuery =
      query.length === 0 || item.content.toLocaleLowerCase().includes(query);
    const matchesStatus =
      filters.status === "all" || item.status === filters.status;
    const matchesType = filters.type === "all" || item.type === filters.type;

    return matchesQuery && matchesStatus && matchesType;
  });
}
