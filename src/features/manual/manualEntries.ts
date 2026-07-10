import { addDays, endOfDay, isValid, parseISO } from "date-fns";

import type { ManualEntry } from "@/shared/types";

export type ManualEntryFilter = {
  category: ManualEntry["category"] | "all";
  status: ManualEntry["status"] | "all";
  query: string;
};

export function sortManualEntries(
  entries: ReadonlyArray<ManualEntry>
): ManualEntry[] {
  return [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function isManualEntryReviewDue(
  entry: ManualEntry,
  referenceDate = new Date()
): boolean {
  if (
    entry.status === "archived" ||
    !entry.reviewIntervalDays ||
    entry.reviewIntervalDays <= 0
  ) {
    return false;
  }

  const reviewBase = entry.lastReviewedAt ?? entry.updatedAt;
  const parsedBase = parseISO(reviewBase);
  if (!isValid(parsedBase)) {
    return false;
  }

  const dueDate = addDays(parsedBase, entry.reviewIntervalDays);
  return dueDate.getTime() <= endOfDay(referenceDate).getTime();
}

export function filterManualEntries(
  entries: ReadonlyArray<ManualEntry>,
  filter: ManualEntryFilter
): ManualEntry[] {
  const query = filter.query.trim().toLowerCase();

  return sortManualEntries(entries).filter((entry) => {
    const matchesCategory =
      filter.category === "all" || entry.category === filter.category;
    const matchesStatus =
      filter.status === "all" || entry.status === filter.status;
    const matchesQuery =
      query.length === 0 ||
      [entry.title, entry.body, entry.category, entry.status, ...entry.tags]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return matchesCategory && matchesStatus && matchesQuery;
  });
}

export function getManualEntrySummary(
  entries: ReadonlyArray<ManualEntry>,
  referenceDate = new Date()
) {
  const sortedEntries = sortManualEntries(entries);

  return {
    totalCount: entries.length,
    activeCount: entries.filter((entry) => entry.status === "active").length,
    reviewDueCount: entries.filter((entry) =>
      isManualEntryReviewDue(entry, referenceDate)
    ).length,
    latestUpdatedEntry: sortedEntries[0],
  };
}
