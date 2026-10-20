import { format, getDay } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { FinanceObligation, Goal, Project, Task, WeeklyPlan } from "@/shared/types";
import { buildHomeFinanceOverview, type HomeFinanceOverviewState } from "../homeFinanceOverview";
import { getGoalsSummary } from "@/features/goals";
import { getLifeAreasSummary, mergeLifeAreas } from "@/features/lifeAreas";
import { getManualEntrySummary } from "@/features/manual";
import { getHomePlanningFocus } from "../homePlanningFocus";
import { buildHomeLearningSnapshot } from "../homeLearningSnapshot";
import { buildHomePersonalMetrics } from "../personalMetrics";
import { getWeeklyPlanWeekStart } from "@/features/weeklyReview/weeklyPlan";
import { buildLocalReminderSnapshot } from "@/features/reminders";
import type { HomeDashboardData } from "../types";

function getHomeWeeklyPlanLinks(
  weeklyPlan: WeeklyPlan | undefined,
  goals: ReadonlyArray<Goal>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): NonNullable<HomeDashboardData["weeklyPlanLinks"]> {
  if (!weeklyPlan) {
    return [];
  }

  const links: NonNullable<HomeDashboardData["weeklyPlanLinks"]> = [];
  if (weeklyPlan.goalId) {
    const goal = goals.find((entry) => entry.id === weeklyPlan.goalId);
    links.push({ kind: "goal", id: weeklyPlan.goalId, title: goal?.title, to: goal ? `/goals?${new URLSearchParams({ focusId: goal.id }).toString()}` : undefined });
  }
  if (weeklyPlan.projectId) {
    const project = projects.find((entry) => entry.id === weeklyPlan.projectId);
    links.push({ kind: "project", id: weeklyPlan.projectId, title: project?.title, to: project ? `/projects?${new URLSearchParams({ focusId: project.id }).toString()}` : undefined });
  }
  if (weeklyPlan.taskId) {
    const task = tasks.find((entry) => entry.id === weeklyPlan.taskId);
    links.push({ kind: "task", id: weeklyPlan.taskId, title: task?.title, to: task ? `/today?${new URLSearchParams({ focusId: task.id }).toString()}` : undefined });
  }

  return links;
}

function byUpdatedAtDescending<T extends { updatedAt: string }>(a: T, b: T) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function useHomeDashboard() {
  const { tasks, dailyCheckins, projects, journal, knowledge, goals, lifeAreas, manual, inbox, weeklyPlans, finance, routines, resources } =
    useStorageAdapter();
  const { t } = useI18n();
  const [data, setData] = useState<HomeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [financeOverview, setFinanceOverview] = useState<HomeFinanceOverviewState>({
    data: null, isLoading: true, hasError: false,
  });
  const loadVersion = useRef(0);
  const lastObligations = useRef<FinanceObligation[]>([]);

  const loadDashboard = useCallback(async () => {
    const version = ++loadVersion.current;
    setFinanceOverview((previous) => ({ ...previous, isLoading: true }));
    const referenceDate = new Date();
    // Share these reads with the existing Home summary and reminder projection.
    const financeLoad = Promise.resolve().then(() => Promise.all([
      finance.listTransactions(), finance.listObligations(),
    ])).then(([transactions, obligations]) => {
      const snapshot = buildHomeFinanceOverview(transactions, obligations, referenceDate);
      if (version === loadVersion.current) {
        lastObligations.current = obligations;
        setFinanceOverview({ data: snapshot, isLoading: false, hasError: false });
      }
      return { snapshot, transactions, obligations };
    }).catch(() => {
      if (version === loadVersion.current) {
        setFinanceOverview((previous) => ({ ...previous, isLoading: false, hasError: true }));
      }
      return null;
    });
    setIsLoading(true);
    setHasError(false);

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [
        allTasks,
        allCheckins,
        allProjects,
        journalEntries,
        knowledgeItems,
        goalEntries,
        lifeAreaEntries,
        manualEntries,
        inboxItems,
        weeklyPlan,
        financeResult,
        routineEntries,
        resourceItems,
      ] =
        await Promise.all([
          tasks.list(),
          dailyCheckins.list(),
          projects.list(),
          journal.list(),
          knowledge.list(),
          goals.list(),
          lifeAreas.list(),
          manual.list(),
          inbox.list(),
          weeklyPlans.getByWeekStart(getWeeklyPlanWeekStart()),
          financeLoad,
          routines.list(),
          resources.list(),
        ]);

      const todayTasks = allTasks.filter((task) => task.dueDate === today);
      const checkin = allCheckins.find((entry) => entry.date === today);
      const createdRoutineIdsToday = new Set(
        todayTasks
          .filter((task) => task.routineId)
          .map((task) => task.routineId)
      );
      const routineSuggestion = routineEntries.find(
        (routine) =>
          routine.isActive &&
          routine.weekdays.includes(getDay(new Date())) &&
          !createdRoutineIdsToday.has(routine.id)
      );
      const recentProjects = [...allProjects]
        .sort(byUpdatedAtDescending)
        .slice(0, 3);
      const latestJournal = [...journalEntries].sort(byUpdatedAtDescending)[0];
      const latestKnowledge = [...knowledgeItems].sort(byUpdatedAtDescending)[0];
      const latestResource = [...resourceItems].sort(byUpdatedAtDescending)[0];
      const goalSummary = getGoalsSummary(goalEntries);
      const lifeAreaViews = mergeLifeAreas(lifeAreaEntries, t);
      const lifeAreaSummary = getLifeAreasSummary(lifeAreaViews, new Date());
      const manualSummary = getManualEntrySummary(manualEntries, new Date());
      if (version !== loadVersion.current) return;
      const taskReminders = buildLocalReminderSnapshot(allTasks, financeResult?.obligations ?? lastObligations.current, referenceDate);

      setData((previous) => ({
        tasks: allTasks,
        today: {
          tasks: todayTasks,
          completedTaskCount: todayTasks.filter((task) => task.status === "done")
            .length,
          mitTask:
            todayTasks.find((task) => task.id === checkin?.mitTaskId) ??
            todayTasks.find((task) => task.isMit),
          checkin,
        },
        projects: {
          totalCount: allProjects.length,
          activeCount: allProjects.filter((project) => project.status === "active")
            .length,
          recent: recentProjects,
        },
        journal: {
          totalCount: journalEntries.length,
          latest: latestJournal,
        },
        knowledge: {
          totalCount: knowledgeItems.length,
          latest: latestKnowledge,
        },
        resources: {
          totalCount: resourceItems.length,
          inProgressCount: resourceItems.filter(
            (resource) => resource.status === "in_progress"
          ).length,
          latest: latestResource,
        },
        goals: {
          totalCount: goalSummary.totalCount,
          activeCount: goalSummary.activeCount,
          reviewDueCount: goalSummary.reviewDueCount,
          highImportanceActiveCount: goalSummary.highImportanceActiveCount,
          averageActiveProgress: goalSummary.averageActiveProgress,
          latest: goalSummary.latestUpdatedGoal,
        },
        finance: financeResult?.snapshot ?? previous?.finance ?? null,
        lifeAreas: {
          totalCount: lifeAreaSummary.totalCount,
          activeCount: lifeAreaSummary.activeCount,
          highAttentionActiveCount: lifeAreaSummary.highAttentionActiveCount,
          reviewDueCount: lifeAreaSummary.reviewDueCount,
          averageSatisfactionScore: lifeAreaSummary.averageSatisfactionScore,
          latest: lifeAreaSummary.latestReviewedArea,
        },
        manual: {
          totalCount: manualSummary.totalCount,
          activeCount: manualSummary.activeCount,
          reviewDueCount: manualSummary.reviewDueCount,
          latest: manualSummary.latestUpdatedEntry,
        },
        inbox: {
          unprocessedCount: inboxItems.filter((item) => item.status === "unprocessed").length,
        },
        routineSuggestion,
        planningFocus: getHomePlanningFocus(goalEntries, allProjects, allTasks),
        weeklyPlan,
        weeklyPlanLinks: getHomeWeeklyPlanLinks(weeklyPlan, goalEntries, allProjects, allTasks),
        learningSnapshot: buildHomeLearningSnapshot({
          goals: goalEntries,
          resources: resourceItems,
          knowledgeItems,
        }),
        reminderSnapshot: taskReminders,
        personalMetrics: buildHomePersonalMetrics({
          tasks: allTasks,
          journalEntries,
          knowledgeItems,
          projects: allProjects,
          goals: goalEntries,
          dailyCheckins: allCheckins,
        }),
        isEmpty:
          allTasks.length === 0 &&
          !checkin &&
          allProjects.length === 0 &&
          journalEntries.length === 0 &&
          knowledgeItems.length === 0 &&
          goalEntries.length === 0 &&
          lifeAreaEntries.length === 0 &&
          financeResult !== null &&
          financeResult.transactions.length === 0 &&
          financeResult.obligations.length === 0 &&
          manualEntries.length === 0 &&
          resourceItems.length === 0 &&
          inboxItems.length === 0,
      }));
    } catch {
      if (version === loadVersion.current) setHasError(true);
    } finally {
      if (version === loadVersion.current) setIsLoading(false);
    }
  }, [dailyCheckins, finance, goals, inbox, journal, knowledge, lifeAreas, manual, projects, resources, routines, tasks, t, weeklyPlans]);

  useEffect(() => {
    void loadDashboard();
    return () => { loadVersion.current += 1; };
  }, [loadDashboard]);

  return { data, isLoading, hasError, financeOverview, loadDashboard };
}
