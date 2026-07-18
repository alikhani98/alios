import { describe, expect, it } from "vitest";

import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";

import { createWeeklyPlanTaskPath, getWeeklyPlanLinks } from "../weeklyPlanLinks";

const timestamp = "2026-07-18T08:00:00.000Z";

const goal: Goal = {
  id: "goal / one", title: "Goal one", description: "", area: "personal", timeframe: "month",
  status: "active", importance: "medium", progressPercent: 0, tags: [], createdAt: timestamp, updatedAt: timestamp,
};
const project: Project = {
  id: "project / one", title: "Project one", status: "active", priority: "medium", createdAt: timestamp, updatedAt: timestamp,
};
const task: Task = {
  id: "task / one", title: "Task one", status: "todo", priority: "medium", isMit: false, createdAt: timestamp, updatedAt: timestamp,
};
const plan: WeeklyPlan = {
  id: "plan", weekStart: "2026-07-13", focusTitle: "Focus", goalId: goal.id, projectId: project.id, taskId: task.id,
  createdAt: timestamp, updatedAt: timestamp,
};

describe("weekly plan links", () => {
  it("creates a stable Today focus path", () => {
    expect(createWeeklyPlanTaskPath("task / one")).toBe("/today?focusId=task+%2F+one");
  });

  it("resolves available goal, project, and task links", () => {
    expect(getWeeklyPlanLinks(plan, [goal], [project], [task])).toEqual([
      { kind: "goal", id: goal.id, title: goal.title, to: "/goals?focusId=goal+%2F+one" },
      { kind: "project", id: project.id, title: project.title, to: "/projects?focusId=project+%2F+one" },
      { kind: "task", id: task.id, title: task.title, to: "/today?focusId=task+%2F+one" },
    ]);
  });

  it("keeps missing linked records non-destructive and without a broken destination", () => {
    expect(getWeeklyPlanLinks(plan, [], [], [])).toEqual([
      { kind: "goal", id: goal.id, title: undefined, to: undefined },
      { kind: "project", id: project.id, title: undefined, to: undefined },
      { kind: "task", id: task.id, title: undefined, to: undefined },
    ]);
  });
});
