import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";

import {
  getTodayWeekStart,
  getTodayWeeklyPlanFocus,
  type TodayWeeklyPlanFocus,
} from "../todayWeeklyPlan";

export function useTodayWeeklyPlan() {
  const { goals, projects, tasks, weeklyPlans } = useStorageAdapter();
  const [focus, setFocus] = useState<TodayWeeklyPlanFocus>({
    linkedTaskTotal: 0,
    linkedTaskCompleted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadTodayWeeklyPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plan, goalEntries, projectEntries, taskEntries] = await Promise.all([
        weeklyPlans.getByWeekStart(getTodayWeekStart()),
        goals.list(),
        projects.list(),
        tasks.list(),
      ]);
      setFocus(getTodayWeeklyPlanFocus(plan, goalEntries, projectEntries, taskEntries));
    } finally {
      setIsLoading(false);
    }
  }, [goals, projects, tasks, weeklyPlans]);

  useEffect(() => {
    void loadTodayWeeklyPlan();
  }, [loadTodayWeeklyPlan]);

  return { focus, isLoading, loadTodayWeeklyPlan };
}
