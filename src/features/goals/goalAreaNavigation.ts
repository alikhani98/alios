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

export function parseLifeAreaFocusSearchParam(
  value: string | null
): LifeAreaKey | null {
  return value !== null && isGoalArea(value) ? value : null;
}

export function updateGoalAreaSearchParams(
  current: URLSearchParams,
  area: GoalArea | "all"
): URLSearchParams {
  const next = new URLSearchParams(current);

  if (area === "all") {
    next.delete("area");
  } else {
    next.set("area", area);
  }

  return next;
}

export function createGoalsForAreaPath(areaKey: LifeAreaKey): string {
  const searchParams = new URLSearchParams({ area: areaKey });
  return `/goals?${searchParams.toString()}`;
}

export function createLifeAreaFocusPath(areaKey: GoalArea): string {
  const searchParams = new URLSearchParams({ focusId: areaKey });
  return `/life-areas?${searchParams.toString()}`;
}
