import { describe, expect, it } from "vitest";

import type { Task } from "@/shared/types";

import {
  countWeeklyPlannedTasks,
  getWeeklyPlanningWeekStart,
  isTaskIncludedInWeeklyPlannedCount,
  summarizeWeeklyPlanningBudget,
} from "../weeklyPlanningBudget";

function createTask(
  id: string,
  dueDate?: string,
  overrides: Partial<Task> = {}
): Task {
  return {
    id,
    title: `Task ${id}`,
    status: "todo",
    priority: "medium",
    dueDate,
    isMit: false,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("weekly planning budget helpers", () => {
  it("uses the existing Monday-starting weekly planning boundary", () => {
    expect(getWeeklyPlanningWeekStart(new Date(2026, 6, 22))).toBe(
      "2026-07-20"
    );
    expect(getWeeklyPlanningWeekStart(new Date(2026, 6, 26))).toBe(
      "2026-07-20"
    );
  });

  it("counts real scheduled tasks inside the selected week", () => {
    const weekStart = "2026-07-20";
    const tasks = [
      createTask("monday", "2026-07-20"),
      createTask("sunday", "2026-07-26"),
      createTask("completed", "2026-07-21", { status: "done" }),
      createTask("deferred", "2026-07-22", { status: "deferred" }),
      createTask("recurring-materialized", "2026-07-23", {
        recurrenceSeriesId: "series-1",
      }),
      createTask("routine-originated", "2026-07-24", {
        routineId: "routine-1",
      }),
    ];

    expect(countWeeklyPlannedTasks(tasks, weekStart)).toBe(6);
  });

  it("excludes missing, invalid, outside-week, and cancelled tasks", () => {
    const weekStart = "2026-07-20";
    const tasks = [
      createTask("without-date"),
      createTask("invalid-date", "2026-13-40"),
      createTask("previous-week", "2026-07-19"),
      createTask("next-week", "2026-07-27"),
      createTask("cancelled", "2026-07-21", { status: "cancelled" }),
    ];

    expect(countWeeklyPlannedTasks(tasks, weekStart)).toBe(0);
    expect(
      isTaskIncludedInWeeklyPlannedCount(createTask("valid", "2026-07-21"), weekStart)
    ).toBe(true);
  });

  it("does not treat overdue tasks from a prior week as planned this week", () => {
    const tasks = [
      createTask("overdue-prior-week", "2026-07-18"),
      createTask("this-week", "2026-07-20"),
    ];

    expect(countWeeklyPlannedTasks(tasks, "2026-07-20")).toBe(1);
  });

  it("returns descriptive difference statuses without capacity percentage", () => {
    const tasks = [
      createTask("one", "2026-07-20"),
      createTask("two", "2026-07-21"),
    ];

    expect(
      summarizeWeeklyPlanningBudget({
        tasks,
        referenceDate: new Date(2026, 6, 22),
      })
    ).toEqual({
      weekStart: "2026-07-20",
      weeklyPlannedTaskCount: 2,
      status: "notConfigured",
    });

    expect(
      summarizeWeeklyPlanningBudget({
        tasks,
        weeklyTaskBudget: 3,
        referenceDate: new Date(2026, 6, 22),
      })
    ).toMatchObject({ difference: 1, status: "underBudget" });
    expect(
      summarizeWeeklyPlanningBudget({
        tasks,
        weeklyTaskBudget: 2,
        referenceDate: new Date(2026, 6, 22),
      })
    ).toMatchObject({ difference: 0, status: "atBudget" });
    expect(
      summarizeWeeklyPlanningBudget({
        tasks,
        weeklyTaskBudget: 1,
        referenceDate: new Date(2026, 6, 22),
      })
    ).toMatchObject({ difference: -1, status: "overBudget" });
  });

  it("keeps date-only comparisons deterministic across DST-like local dates", () => {
    const weekStart = getWeeklyPlanningWeekStart(new Date(2026, 2, 10, 23, 30));
    const tasks = [
      createTask("week-start", weekStart),
      createTask("inside-week", "2026-03-15"),
    ];

    expect(weekStart).toBe("2026-03-09");
    expect(countWeeklyPlannedTasks(tasks, weekStart)).toBe(2);
  });
});
