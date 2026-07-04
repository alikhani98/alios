import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import type { HomeDashboardData } from "../types";

function byUpdatedAtDescending<T extends { updatedAt: string }>(a: T, b: T) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function useHomeDashboard() {
  const { tasks, dailyCheckins, projects, journal, knowledge } =
    useStorageAdapter();
  const [data, setData] = useState<HomeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [allTasks, checkin, allProjects, journalEntries, knowledgeItems] =
        await Promise.all([
          tasks.list(),
          dailyCheckins.getByDate(today),
          projects.list(),
          journal.list(),
          knowledge.list(),
        ]);

      const todayTasks = allTasks.filter((task) => task.dueDate === today);
      const recentProjects = [...allProjects]
        .sort(byUpdatedAtDescending)
        .slice(0, 3);
      const latestJournal = [...journalEntries].sort(byUpdatedAtDescending)[0];
      const latestKnowledge = [...knowledgeItems].sort(byUpdatedAtDescending)[0];

      setData({
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
        isEmpty:
          todayTasks.length === 0 &&
          !checkin &&
          allProjects.length === 0 &&
          journalEntries.length === 0 &&
          knowledgeItems.length === 0,
      });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [dailyCheckins, journal, knowledge, projects, tasks]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return { data, isLoading, hasError, loadDashboard };
}
