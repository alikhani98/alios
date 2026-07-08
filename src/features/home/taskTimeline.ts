import { addDays } from "date-fns";

import type { Task } from "@/shared/types";

export const TASK_TIMELINE_SECTION_KEYS = [
  "overdue",
  "today",
  "tomorrow",
  "thisWeek",
  "later",
] as const;

export type TaskTimelineSection = (typeof TASK_TIMELINE_SECTION_KEYS)[number];

export type TaskTimeline = Record<TaskTimelineSection, Task[]>;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function isCompletedTask(task: Task): boolean {
  return task.status === "done" || task.status === "cancelled";
}

function compareTasks(a: Task, b: Task): number {
  const dueCompare = (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  if (dueCompare !== 0) {
    return dueCompare;
  }

  const updatedCompare = b.updatedAt.localeCompare(a.updatedAt);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }

  const createdCompare = b.createdAt.localeCompare(a.createdAt);
  if (createdCompare !== 0) {
    return createdCompare;
  }

  return a.title.localeCompare(b.title);
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

export function buildTaskTimeline(
  tasks: ReadonlyArray<Task>,
  referenceDate = new Date()
): TaskTimeline {
  const todayKey = getLocalDateKey(referenceDate);
  const tomorrowKey = getLocalDateKey(addDays(referenceDate, 1));
  const weekEndKey = getLocalDateKey(addDays(referenceDate, 7));
  const buckets: TaskTimeline = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  for (const task of tasks) {
    if (isCompletedTask(task) || !task.dueDate) {
      continue;
    }

    const dueDate = parseLocalDate(task.dueDate);
    if (!dueDate) {
      continue;
    }

    const dueKey = task.dueDate;

    if (dueKey < todayKey) {
      buckets.overdue.push(task);
      continue;
    }

    if (dueKey === todayKey) {
      buckets.today.push(task);
      continue;
    }

    if (dueKey === tomorrowKey) {
      buckets.tomorrow.push(task);
      continue;
    }

    if (dueKey <= weekEndKey) {
      buckets.thisWeek.push(task);
      continue;
    }

    buckets.later.push(task);
  }

  return {
    overdue: sortTasks(buckets.overdue),
    today: sortTasks(buckets.today),
    tomorrow: sortTasks(buckets.tomorrow),
    thisWeek: sortTasks(buckets.thisWeek),
    later: sortTasks(buckets.later),
  };
}
