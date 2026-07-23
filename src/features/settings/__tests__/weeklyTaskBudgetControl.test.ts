import { describe, expect, it } from "vitest";

import {
  getNextWeeklyTaskBudgetKeyboardValue,
  parseWeeklyTaskBudgetSliderValue,
} from "../weeklyTaskBudgetControl";

describe("weekly task budget dynamic control helpers", () => {
  it("accepts only valid integer slider values without ambiguous coercion", () => {
    expect(parseWeeklyTaskBudgetSliderValue("1")).toBe(1);
    expect(parseWeeklyTaskBudgetSliderValue("999")).toBe(999);
    expect(parseWeeklyTaskBudgetSliderValue("0")).toBeUndefined();
    expect(parseWeeklyTaskBudgetSliderValue("1.5")).toBeUndefined();
    expect(parseWeeklyTaskBudgetSliderValue("tasks")).toBeUndefined();
  });

  it("steps keyboard values within the Stage 153 min and max", () => {
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 5,
        key: "ArrowRight",
      })
    ).toBe(6);
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 5,
        key: "ArrowLeft",
      })
    ).toBe(4);
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 1,
        key: "ArrowDown",
      })
    ).toBe(1);
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 999,
        key: "ArrowUp",
      })
    ).toBe(999);
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 5,
        key: "Home",
      })
    ).toBe(1);
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 5,
        key: "End",
      })
    ).toBe(999);
    expect(
      getNextWeeklyTaskBudgetKeyboardValue({
        currentValue: 5,
        key: "PageUp",
      })
    ).toBeUndefined();
  });
});
