import { addDays, endOfDay, isValid, parseISO } from "date-fns";

import type { Goal } from "@/shared/types";

export type GoalFilter = {
  status: Goal["status"] | "all";
  area: Goal["area"] | "all";
  timeframe: Goal["timeframe"] | "all";
  importance: Goal["importance"] | "all";
  query: string;
};

export function sortGoals(entries: ReadonlyArray<Goal>): Goal[] {
  return [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getActiveGoals(entries: ReadonlyArray<Goal>): Goal[] {
  return entries.filter((entry) => entry.status === "active");
}

export function getCompletedGoals(entries: ReadonlyArray<Goal>): Goal[] {
  return entries.filter((entry) => entry.status === "completed");
}

export function getArchivedGoals(entries: ReadonlyArray<Goal>): Goal[] {
  return entries.filter((entry) => entry.status === "archived");
}

export function clampGoalProgressPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.trunc(value)));
}

export function isGoalReviewDue(
  goal: Goal,
  referenceDate = new Date()
): boolean {
  if (
    goal.status !== "active" ||
    !goal.reviewIntervalDays ||
    goal.reviewIntervalDays <= 0
  ) {
    return false;
  }

  const reviewBase = goal.lastReviewedAt ?? goal.updatedAt;
  const parsedBase = parseISO(reviewBase);
  if (!isValid(parsedBase)) {
    return false;
  }

  const dueDate = addDays(parsedBase, goal.reviewIntervalDays);
  return dueDate.getTime() <= endOfDay(referenceDate).getTime();
}

export function getReviewDueGoals(
  entries: ReadonlyArray<Goal>,
  referenceDate = new Date()
): Goal[] {
  return sortGoals(entries).filter((goal) => isGoalReviewDue(goal, referenceDate));
}

export function filterGoals(
  entries: ReadonlyArray<Goal>,
  filter: GoalFilter
): Goal[] {
  const query = filter.query.trim().toLowerCase();

  return sortGoals(entries).filter((goal) => {
    const matchesStatus = filter.status === "all" || goal.status === filter.status;
    const matchesArea = filter.area === "all" || goal.area === filter.area;
    const matchesTimeframe =
      filter.timeframe === "all" || goal.timeframe === filter.timeframe;
    const matchesImportance =
      filter.importance === "all" || goal.importance === filter.importance;
    const searchable = [
      goal.title,
      goal.description,
      goal.area,
      goal.timeframe,
      goal.status,
      goal.importance,
      goal.tags.join(" "),
      String(goal.progressPercent),
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = query.length === 0 || searchable.includes(query);

    return (
      matchesStatus &&
      matchesArea &&
      matchesTimeframe &&
      matchesImportance &&
      matchesQuery
    );
  });
}

export function getGoalsSummary(entries: ReadonlyArray<Goal>) {
  const activeGoals = getActiveGoals(entries);
  const activeProgress =
    activeGoals.length === 0
      ? null
      : activeGoals.reduce((total, goal) => total + goal.progressPercent, 0) /
        activeGoals.length;

  return {
    totalCount: entries.length,
    activeCount: activeGoals.length,
    pausedCount: entries.filter((goal) => goal.status === "paused").length,
    completedCount: getCompletedGoals(entries).length,
    archivedCount: getArchivedGoals(entries).length,
    reviewDueCount: getReviewDueGoals(entries).length,
    highImportanceActiveCount: activeGoals.filter(
      (goal) => goal.importance === "high"
    ).length,
    averageActiveProgress: activeProgress,
    latestUpdatedGoal: sortGoals(entries)[0],
  };
}
