import { describe, expect, it } from "vitest";

import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";

import { getWeeklyPlanExecution } from "../weeklyPlanExecution";

const timestamp = "2026-07-18T08:00:00.000Z";
const goal: Goal = { id: "goal", title: "Goal", description: "", area: "personal", timeframe: "month", status: "active", importance: "medium", progressPercent: 0, tags: [], createdAt: timestamp, updatedAt: timestamp };
const project: Project = { id: "project", title: "Project", status: "active", priority: "medium", goalId: goal.id, createdAt: timestamp, updatedAt: timestamp };
const task: Task = { id: "task", title: "Task", status: "todo", priority: "medium", isMit: false, projectId: project.id, createdAt: timestamp, updatedAt: timestamp };
const plan: WeeklyPlan = { id: "plan", weekStart: "2026-07-13", focusTitle: "Focus", goalId: goal.id, projectId: project.id, taskId: task.id, createdAt: timestamp, updatedAt: timestamp };

describe("weekly plan execution", () => {
  it("derives active execution only from the plan's existing linked tasks", () => {
    expect(getWeeklyPlanExecution(plan, [goal], [project], [task, { ...task, id: "done", status: "done" }])).toEqual({
      state: "active",
      total: 2,
      completed: 1,
      open: 1,
    });
  });

  it("reports completion without creating a task or a stored roll-up", () => {
    expect(getWeeklyPlanExecution(plan, [goal], [project], [{ ...task, status: "done" }])).toEqual({
      state: "completed",
      total: 1,
      completed: 1,
      open: 0,
    });
  });

  it("keeps an unavailable link or empty plan calm", () => {
    expect(getWeeklyPlanExecution(plan, [], [], [])).toEqual({
      state: "empty",
      total: 0,
      completed: 0,
      open: 0,
    });
  });
});
