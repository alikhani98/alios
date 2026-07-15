import type { Goal, LifeAreaKey } from "@/shared/types";

export type LifeAreaGoalSummary = {
  totalCount: number;
  activeCount: number;
  completedCount: number;
  averageActiveProgress: number | null;
};

export function getLifeAreaGoalSummary(
  goals: ReadonlyArray<Goal>,
  areaKey: LifeAreaKey
): LifeAreaGoalSummary {
  const linkedGoals = goals.filter((goal) => goal.area === areaKey);
  const activeGoals = linkedGoals.filter((goal) => goal.status === "active");
  const averageActiveProgress =
    activeGoals.length === 0
      ? null
      : activeGoals.reduce(
          (total, goal) => total + goal.progressPercent,
          0
        ) / activeGoals.length;

  return {
    totalCount: linkedGoals.length,
    activeCount: activeGoals.length,
    completedCount: linkedGoals.filter((goal) => goal.status === "completed")
      .length,
    averageActiveProgress,
  };
}
