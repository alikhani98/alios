import type { InboxItem, InboxItemStatus, InboxItemType } from "@/shared/types";

export type InboxStatusFilter = InboxItemStatus | "all";
export type InboxTypeFilter = InboxItemType | "all";

export type InboxFilters = {
  query: string;
  status: InboxStatusFilter;
  type: InboxTypeFilter;
};

export function filterInboxItems(
  items: InboxItem[],
  filters: InboxFilters
): InboxItem[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return items.filter((item) => {
    const matchesQuery =
      query.length === 0 || item.content.toLocaleLowerCase().includes(query);
    const matchesStatus =
      filters.status === "all" || item.status === filters.status;
    const matchesType = filters.type === "all" || item.type === filters.type;

    return matchesQuery && matchesStatus && matchesType;
  });
}
