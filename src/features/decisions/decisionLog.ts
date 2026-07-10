import { endOfDay, isValid, parseISO } from "date-fns";

import type { DecisionLogEntry } from "@/shared/types";

export type DecisionLogFilter =
  | "all"
  | "open"
  | "decided"
  | "needsReview"
  | "reviewed";

export function isDecisionNeedsReview(
  decision: DecisionLogEntry,
  referenceDate = new Date()
): boolean {
  if (decision.status === "reviewed" || decision.status === "archived") {
    return false;
  }

  if (!decision.reviewDate) {
    return false;
  }

  const parsedReviewDate = parseISO(decision.reviewDate);
  if (!isValid(parsedReviewDate)) {
    return false;
  }

  return parsedReviewDate.getTime() <= endOfDay(referenceDate).getTime();
}

export function filterDecisionLogEntries(
  entries: ReadonlyArray<DecisionLogEntry>,
  filter: DecisionLogFilter,
  referenceDate = new Date()
): DecisionLogEntry[] {
  return entries.filter((entry) => {
    switch (filter) {
      case "open":
        return entry.status === "open";
      case "decided":
        return entry.status === "decided";
      case "needsReview":
        return isDecisionNeedsReview(entry, referenceDate);
      case "reviewed":
        return entry.status === "reviewed";
      case "all":
      default:
        return true;
    }
  });
}

export function getDecisionLogFilterCounts(
  entries: ReadonlyArray<DecisionLogEntry>,
  referenceDate = new Date()
): Record<DecisionLogFilter, number> {
  return {
    all: entries.length,
    open: entries.filter((entry) => entry.status === "open").length,
    decided: entries.filter((entry) => entry.status === "decided").length,
    needsReview: entries.filter((entry) => isDecisionNeedsReview(entry, referenceDate)).length,
    reviewed: entries.filter((entry) => entry.status === "reviewed").length,
  };
}
