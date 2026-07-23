import {
  parseWeeklyTaskBudgetInput,
  WEEKLY_TASK_BUDGET_MAX,
  WEEKLY_TASK_BUDGET_MIN,
} from "@/shared/preferences/weeklyTaskBudget";

export type WeeklyTaskBudgetKeyboardKey =
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "End"
  | "Home";

export function parseWeeklyTaskBudgetSliderValue(
  value: string
): number | undefined {
  const parsed = parseWeeklyTaskBudgetInput(value);
  return parsed.success ? parsed.value : undefined;
}

export function getNextWeeklyTaskBudgetKeyboardValue({
  currentValue,
  key,
}: {
  currentValue: number;
  key: string;
}): number | undefined {
  switch (key as WeeklyTaskBudgetKeyboardKey) {
    case "ArrowDown":
    case "ArrowLeft":
      return Math.max(WEEKLY_TASK_BUDGET_MIN, currentValue - 1);
    case "ArrowRight":
    case "ArrowUp":
      return Math.min(WEEKLY_TASK_BUDGET_MAX, currentValue + 1);
    case "Home":
      return WEEKLY_TASK_BUDGET_MIN;
    case "End":
      return WEEKLY_TASK_BUDGET_MAX;
    default:
      return undefined;
  }
}
