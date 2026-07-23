import { beforeEach, describe, expect, it } from "vitest";

import {
  formatWeeklyTaskBudgetInput,
  normalizeStoredWeeklyTaskBudget,
  normalizeWeeklyTaskBudgetInput,
  parseWeeklyTaskBudgetInput,
  serializeWeeklyTaskBudget,
  WEEKLY_TASK_BUDGET_MAX,
  WEEKLY_TASK_BUDGET_MIN,
  WEEKLY_TASK_BUDGET_STEP,
} from "../weeklyTaskBudget";

describe("weekly task budget preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("documents the approved range and step", () => {
    expect(WEEKLY_TASK_BUDGET_MIN).toBe(1);
    expect(WEEKLY_TASK_BUDGET_MAX).toBe(999);
    expect(WEEKLY_TASK_BUDGET_STEP).toBe(1);
  });

  it("accepts valid whole-number budgets at the boundaries", () => {
    expect(parseWeeklyTaskBudgetInput("1")).toEqual({
      success: true,
      value: 1,
    });
    expect(parseWeeklyTaskBudgetInput("999")).toEqual({
      success: true,
      value: 999,
    });
  });

  it("treats empty input as not configured rather than zero", () => {
    expect(parseWeeklyTaskBudgetInput("")).toEqual({
      success: false,
      error: "empty",
    });
    expect(normalizeStoredWeeklyTaskBudget(null)).toBeUndefined();
    expect(normalizeStoredWeeklyTaskBudget("")).toBeUndefined();
    expect(formatWeeklyTaskBudgetInput(undefined)).toBe("");
  });

  it("rejects zero, negative values, decimals, letters, and oversized numbers", () => {
    expect(parseWeeklyTaskBudgetInput("0")).toEqual({
      success: false,
      error: "belowMin",
    });
    expect(parseWeeklyTaskBudgetInput("-1")).toEqual({
      success: false,
      error: "belowMin",
    });
    expect(parseWeeklyTaskBudgetInput("1.5")).toEqual({
      success: false,
      error: "notInteger",
    });
    expect(parseWeeklyTaskBudgetInput("tasks")).toEqual({
      success: false,
      error: "notInteger",
    });
    expect(parseWeeklyTaskBudgetInput("1000")).toEqual({
      success: false,
      error: "aboveMax",
    });
  });

  it("normalizes whitespace plus Persian and Arabic-Indic digits before validation", () => {
    expect(normalizeWeeklyTaskBudgetInput(" ۱۲ ")).toBe("12");
    expect(normalizeWeeklyTaskBudgetInput(" ١٢ ")).toBe("12");
    expect(parseWeeklyTaskBudgetInput(" ۱۲ ")).toEqual({
      success: true,
      value: 12,
    });
  });

  it("normalizes invalid legacy stored values conservatively", () => {
    expect(normalizeStoredWeeklyTaskBudget("15")).toBe(15);
    expect(normalizeStoredWeeklyTaskBudget("0")).toBeUndefined();
    expect(normalizeStoredWeeklyTaskBudget("not-a-number")).toBeUndefined();
    expect(normalizeStoredWeeklyTaskBudget("1000")).toBeUndefined();
  });

  it("serializes only already validated values", () => {
    expect(serializeWeeklyTaskBudget(7)).toBe("7");
    expect(formatWeeklyTaskBudgetInput(7)).toBe("7");
  });
});
