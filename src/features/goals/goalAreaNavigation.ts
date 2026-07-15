import { GOAL_AREA_VALUES } from "@/shared/constants/domain";
import type { GoalArea, LifeAreaKey } from "@/shared/types";

export function isGoalArea(value: string): value is GoalArea {
  return GOAL_AREA_VALUES.some((area) => area === value);
}

export function parseGoalAreaSearchParam(
  value: string | null
): GoalArea | "all" {
  return value !== null && isGoalArea(value) ? value : "all";
}

export function createGoalsForAreaPath(areaKey: LifeAreaKey): string {
  const searchParams = new URLSearchParams({ area: areaKey });
  return `/goals?${searchParams.toString()}`;
}

export function createLifeAreaFocusPath(areaKey: GoalArea): string {
  const searchParams = new URLSearchParams({ focusId: areaKey });
  return `/life-areas?${searchParams.toString()}`;
}
