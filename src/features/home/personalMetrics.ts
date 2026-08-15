import { format, isValid, parseISO, startOfDay, subDays } from "date-fns";

import { getCurrentCheckinStreak } from "@/features/weeklyReview/weeklyReviewCalculations";
import type {
  DailyCheckin,
  Goal,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
} from "@/shared/types";

export type HomePersonalMetrics = {
  tasks: {
    completedAllTime: number;
    completedLastSevenDays: number;
    activeNow: number;
  };
  journal: {
    totalEntries: number;
    entriesLastThirtyDays: number;
  };
  knowledge: {
    totalItems: number;
  };
  projects: {
    activeCount: number;
  };
  goals: {
    activeCount: number;
  };
  checkins: {
    currentStreak: number;
    completionPercentLastThirtyDays: number;
    completedLastThirtyDays: number;
  };
  hasAnySignal: boolean;
};

type BuildHomePersonalMetricsInput = {
  tasks: ReadonlyArray<Task>;
  journalEntries: ReadonlyArray<JournalEntry>;
  knowledgeItems: ReadonlyArray<KnowledgeItem>;
  projects: ReadonlyArray<Project>;
  goals: ReadonlyArray<Goal>;
  dailyCheckins: ReadonlyArray<DailyCheckin>;
};

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function getDateKey(value: Date): string {
  return format(startOfDay(value), "yyyy-MM-dd");
}

function isOnOrAfter(value: string | undefined, start: Date): boolean {
  const parsed = parseDate(value);
  return parsed !== null && parsed.getTime() >= start.getTime();
}

function getTaskCompletionDate(task: Task): string | undefined {
  return task.completedAt ?? task.updatedAt;
}

function isActiveTask(task: Task): boolean {
  return task.status !== "done" && task.status !== "cancelled";
}

function isActiveProject(project: Project): boolean {
  return (
    project.status !== "archived" &&
    project.status !== "completed" &&
    String(project.status) !== "done"
  );
}

function isActiveGoal(goal: Goal): boolean {
  return (
    goal.status !== "archived" &&
    goal.status !== "completed" &&
    String(goal.status) !== "done"
  );
}

export function buildHomePersonalMetrics(
  input: BuildHomePersonalMetricsInput,
  referenceDate = new Date()
): HomePersonalMetrics {
  const lastSevenDaysStart = startOfDay(subDays(referenceDate, 6));
  const lastThirtyDaysStart = startOfDay(subDays(referenceDate, 29));
  const lastThirtyDateKeys = new Set(
    Array.from({ length: 30 }, (_, index) =>
      getDateKey(subDays(referenceDate, index))
    )
  );
  const completedTasks = input.tasks.filter((task) => task.status === "done");
  const completedLastSevenDays = completedTasks.filter((task) =>
    isOnOrAfter(getTaskCompletionDate(task), lastSevenDaysStart)
  );
  const journalEntriesLastThirtyDays = input.journalEntries.filter((entry) =>
    isOnOrAfter(entry.date, lastThirtyDaysStart)
  );
  const checkinsLastThirtyDays = input.dailyCheckins.filter((checkin) =>
    lastThirtyDateKeys.has(checkin.date)
  );

  const metrics: HomePersonalMetrics = {
    tasks: {
      completedAllTime: completedTasks.length,
      completedLastSevenDays: completedLastSevenDays.length,
      activeNow: input.tasks.filter(isActiveTask).length,
    },
    journal: {
      totalEntries: input.journalEntries.length,
      entriesLastThirtyDays: journalEntriesLastThirtyDays.length,
    },
    knowledge: {
      totalItems: input.knowledgeItems.length,
    },
    projects: {
      activeCount: input.projects.filter(isActiveProject).length,
    },
    goals: {
      activeCount: input.goals.filter(isActiveGoal).length,
    },
    checkins: {
      currentStreak: getCurrentCheckinStreak(
        input.dailyCheckins,
        referenceDate
      ),
      completionPercentLastThirtyDays: Math.round(
        (checkinsLastThirtyDays.length / 30) * 100
      ),
      completedLastThirtyDays: checkinsLastThirtyDays.length,
    },
    hasAnySignal: false,
  };

  metrics.hasAnySignal =
    metrics.tasks.completedAllTime > 0 ||
    metrics.tasks.completedLastSevenDays > 0 ||
    metrics.tasks.activeNow > 0 ||
    metrics.journal.totalEntries > 0 ||
    metrics.journal.entriesLastThirtyDays > 0 ||
    metrics.knowledge.totalItems > 0 ||
    metrics.projects.activeCount > 0 ||
    metrics.goals.activeCount > 0 ||
    metrics.checkins.currentStreak > 0 ||
    metrics.checkins.completedLastThirtyDays > 0;

  return metrics;
}
