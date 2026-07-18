import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import { getGoalsSummary } from "@/features/goals";
import { getLifeAreasSummary, mergeLifeAreas } from "@/features/lifeAreas";
import { getManualEntrySummary } from "@/features/manual";
import { getHomePlanningFocus } from "../homePlanningFocus";
import { getWeeklyPlanWeekStart } from "@/features/weeklyReview/weeklyPlan";
import type { HomeDashboardData } from "../types";

function byUpdatedAtDescending<T extends { updatedAt: string }>(a: T, b: T) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function useHomeDashboard() {
  const { tasks, dailyCheckins, projects, journal, knowledge, goals, lifeAreas, manual, inbox, weeklyPlans } =
    useStorageAdapter();
  const { t } = useI18n();
  const [data, setData] = useState<HomeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [
        allTasks,
        checkin,
        allProjects,
        journalEntries,
        knowledgeItems,
        goalEntries,
        lifeAreaEntries,
        manualEntries,
        inboxItems,
        weeklyPlan,
      ] =
        await Promise.all([
          tasks.list(),
          dailyCheckins.getByDate(today),
          projects.list(),
          journal.list(),
          knowledge.list(),
          goals.list(),
          lifeAreas.list(),
          manual.list(),
          inbox.list(),
          weeklyPlans.getByWeekStart(getWeeklyPlanWeekStart()),
        ]);

      const todayTasks = allTasks.filter((task) => task.dueDate === today);
      const recentProjects = [...allProjects]
        .sort(byUpdatedAtDescending)
        .slice(0, 3);
      const latestJournal = [...journalEntries].sort(byUpdatedAtDescending)[0];
      const latestKnowledge = [...knowledgeItems].sort(byUpdatedAtDescending)[0];
      const goalSummary = getGoalsSummary(goalEntries);
      const lifeAreaViews = mergeLifeAreas(lifeAreaEntries, t);
      const lifeAreaSummary = getLifeAreasSummary(lifeAreaViews, new Date());
      const manualSummary = getManualEntrySummary(manualEntries, new Date());

      setData({
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
        goals: {
          totalCount: goalSummary.totalCount,
          activeCount: goalSummary.activeCount,
          reviewDueCount: goalSummary.reviewDueCount,
          highImportanceActiveCount: goalSummary.highImportanceActiveCount,
          averageActiveProgress: goalSummary.averageActiveProgress,
          latest: goalSummary.latestUpdatedGoal,
        },
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
        planningFocus: getHomePlanningFocus(goalEntries, allProjects, allTasks),
        weeklyPlan,
        isEmpty:
          allTasks.length === 0 &&
          !checkin &&
          allProjects.length === 0 &&
          journalEntries.length === 0 &&
          knowledgeItems.length === 0 &&
          goalEntries.length === 0 &&
          lifeAreaEntries.length === 0 &&
          manualEntries.length === 0 &&
          inboxItems.length === 0,
      });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [dailyCheckins, goals, inbox, journal, knowledge, lifeAreas, manual, projects, tasks, t, weeklyPlans]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return { data, isLoading, hasError, loadDashboard };
}
