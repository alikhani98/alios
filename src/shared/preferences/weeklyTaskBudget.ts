export const WEEKLY_TASK_BUDGET_STORAGE_KEY =
  "alios.planning.weeklyTaskBudget";
export const WEEKLY_TASK_BUDGET_MIN = 1;
export const WEEKLY_TASK_BUDGET_MAX = 999;
export const WEEKLY_TASK_BUDGET_STEP = 1;

export type WeeklyTaskBudgetValidationError =
  | "empty"
  | "notInteger"
  | "belowMin"
  | "aboveMax";

export type WeeklyTaskBudgetValidationResult =
  | { success: true; value: number }
  | { success: false; error: WeeklyTaskBudgetValidationError };

const persianDigitMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export function normalizeWeeklyTaskBudgetInput(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹٠-٩]/g, (digit) => persianDigitMap[digit] ?? digit);
}

export function parseWeeklyTaskBudgetInput(
  value: string
): WeeklyTaskBudgetValidationResult {
  const normalizedValue = normalizeWeeklyTaskBudgetInput(value);

  if (normalizedValue.length === 0) {
    return { success: false, error: "empty" };
  }

  if (!/^[+-]?\d+$/.test(normalizedValue)) {
    return { success: false, error: "notInteger" };
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isSafeInteger(numericValue)) {
    return { success: false, error: "notInteger" };
  }

  if (numericValue < WEEKLY_TASK_BUDGET_MIN) {
    return { success: false, error: "belowMin" };
  }

  if (numericValue > WEEKLY_TASK_BUDGET_MAX) {
    return { success: false, error: "aboveMax" };
  }

  return { success: true, value: numericValue };
}

export function normalizeStoredWeeklyTaskBudget(
  value: string | null | undefined
): number | undefined {
  if (value === null || value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = parseWeeklyTaskBudgetInput(value);
  return parsed.success ? parsed.value : undefined;
}

export function serializeWeeklyTaskBudget(value: number): string {
  return String(value);
}

export function formatWeeklyTaskBudgetInput(
  value: number | undefined
): string {
  return value === undefined ? "" : String(value);
}
