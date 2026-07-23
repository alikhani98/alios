import { format, startOfWeek } from "date-fns";

import type { Task } from "@/shared/types";

export type WeeklyPlanningBudgetStatus =
  | "notConfigured"
  | "underBudget"
  | "atBudget"
  | "overBudget";

export type WeeklyPlanningBudgetSummary = {
  weekStart: string;
  weeklyTaskBudget?: number;
  weeklyPlannedTaskCount: number;
  difference?: number;
  status: WeeklyPlanningBudgetStatus;
};

function parseDateOnly(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

export function getWeeklyPlanningWeekStart(referenceDate = new Date()): string {
  return format(startOfWeek(referenceDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function isTaskIncludedInWeeklyPlannedCount(
  task: Task,
  weekStart: string
): boolean {
  if (task.status === "cancelled" || !task.dueDate) {
    return false;
  }

  const weekStartDate = parseDateOnly(weekStart);
  const dueDate = parseDateOnly(task.dueDate);

  if (!weekStartDate || !dueDate) {
    return false;
  }

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  return dueDate >= weekStartDate && dueDate <= weekEndDate;
}

export function countWeeklyPlannedTasks(
  tasks: ReadonlyArray<Task>,
  weekStart: string
): number {
  return tasks.filter((task) =>
    isTaskIncludedInWeeklyPlannedCount(task, weekStart)
  ).length;
}

export function summarizeWeeklyPlanningBudget({
  tasks,
  weeklyTaskBudget,
  referenceDate = new Date(),
}: {
  tasks: ReadonlyArray<Task>;
  weeklyTaskBudget?: number;
  referenceDate?: Date;
}): WeeklyPlanningBudgetSummary {
  const weekStart = getWeeklyPlanningWeekStart(referenceDate);
  const weeklyPlannedTaskCount = countWeeklyPlannedTasks(tasks, weekStart);

  if (weeklyTaskBudget === undefined) {
    return {
      weekStart,
      weeklyPlannedTaskCount,
      status: "notConfigured",
    };
  }

  const difference = weeklyTaskBudget - weeklyPlannedTaskCount;
  const status =
    difference > 0
      ? "underBudget"
      : difference === 0
        ? "atBudget"
        : "overBudget";

  return {
    weekStart,
    weeklyTaskBudget,
    weeklyPlannedTaskCount,
    difference,
    status,
  };
}
