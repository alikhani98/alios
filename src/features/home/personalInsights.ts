import type {
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
} from "@/shared/types";

import { buildTaskTimeline } from "./taskTimeline";
import type { HomeDashboardData } from "./types";

export type CompletionProgress = {
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  progress: number;
};

export type WellnessChecklistProgress = {
  completedCount: number;
  totalCount: number;
  progress: number;
};

export type PersonalInsightsSnapshot = {
  taskCompletion: CompletionProgress;
  overdueCount: number;
  upcomingCount: number;
  activeProjectCount: number;
  totalProjectCount: number;
  unprocessedInboxCount: number;
  journalCount: number;
  knowledgeCount: number;
  wellnessProgress: WellnessChecklistProgress | null;
  hasAnyData: boolean;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function calculateCompletionPercentage(
  completedCount: number,
  totalCount: number
) {
  if (totalCount <= 0) {
    return 0;
  }

  return clampPercentage((completedCount / totalCount) * 100);
}

export function getTaskCompletionProgress(tasks: ReadonlyArray<Task>) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const remainingCount = Math.max(0, totalCount - completedCount);

  return {
    completedCount,
    totalCount,
    remainingCount,
    progress: calculateCompletionPercentage(completedCount, totalCount),
  } satisfies CompletionProgress;
}

export function countOverdueTasks(
  tasks: ReadonlyArray<Task>,
  referenceDate = new Date()
) {
  return buildTaskTimeline(tasks, referenceDate).overdue.length;
}

export function countUpcomingTasks(
  tasks: ReadonlyArray<Task>,
  referenceDate = new Date()
) {
  const timeline = buildTaskTimeline(tasks, referenceDate);

  return timeline.tomorrow.length + timeline.thisWeek.length + timeline.later.length;
}

export function countActiveProjects(projects: ReadonlyArray<Project>) {
  return projects.filter((project) => project.status === "active").length;
}

export function countUnprocessedInboxItems(items: ReadonlyArray<InboxItem>) {
  return items.filter((item) => item.status === "unprocessed").length;
}

export function countJournalEntries(entries: ReadonlyArray<JournalEntry>) {
  return entries.length;
}

export function countKnowledgeItems(items: ReadonlyArray<KnowledgeItem>) {
  return items.length;
}

export function getWellnessChecklistProgress(
  checkedStepIds: ReadonlyArray<string> | null | undefined,
  totalCount: number
) {
  if (totalCount <= 0) {
    return null;
  }

  const uniqueCheckedCount = new Set(checkedStepIds ?? []).size;

  if (uniqueCheckedCount <= 0) {
    return null;
  }

  return {
    completedCount: uniqueCheckedCount,
    totalCount,
    progress: calculateCompletionPercentage(uniqueCheckedCount, totalCount),
  } satisfies WellnessChecklistProgress;
}

export function buildPersonalInsightsSnapshot(
  data: HomeDashboardData,
  options?: {
    wellnessCheckedStepIds?: ReadonlyArray<string> | null;
    wellnessTotalStepCount?: number;
    referenceDate?: Date;
  }
): PersonalInsightsSnapshot {
  const taskCompletion = getTaskCompletionProgress(data.today.tasks);
  const wellnessProgress = getWellnessChecklistProgress(
    options?.wellnessCheckedStepIds,
    options?.wellnessTotalStepCount ?? 0
  );
  const referenceDate = options?.referenceDate ?? new Date();

  const overdueCount = countOverdueTasks(data.tasks, referenceDate);
  const upcomingCount = countUpcomingTasks(data.tasks, referenceDate);

  const snapshot: PersonalInsightsSnapshot = {
    taskCompletion,
    overdueCount,
    upcomingCount,
    activeProjectCount: data.projects.activeCount,
    totalProjectCount: data.projects.totalCount,
    unprocessedInboxCount: data.inbox.unprocessedCount,
    journalCount: data.journal.totalCount,
    knowledgeCount: data.knowledge.totalCount,
    wellnessProgress,
    hasAnyData:
      taskCompletion.totalCount > 0 ||
      overdueCount > 0 ||
      upcomingCount > 0 ||
      data.projects.totalCount > 0 ||
      data.inbox.unprocessedCount > 0 ||
      data.journal.totalCount > 0 ||
      data.knowledge.totalCount > 0 ||
      wellnessProgress !== null,
  };

  return snapshot;
}
