import { describe, expect, it } from "vitest";

import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";

import { getTodayWeekStart, getTodayWeeklyPlanFocus } from "../todayWeeklyPlan";

const timestamp = "2026-07-18T08:00:00.000Z";
const goal: Goal = { id: "goal", title: "Goal", description: "", area: "personal", timeframe: "month", status: "active", importance: "medium", progressPercent: 0, tags: [], createdAt: timestamp, updatedAt: timestamp };
const project: Project = { id: "project", title: "Project", status: "active", priority: "medium", goalId: goal.id, createdAt: timestamp, updatedAt: timestamp };
const task: Task = { id: "task", title: "Task", status: "todo", priority: "medium", isMit: false, projectId: project.id, createdAt: timestamp, updatedAt: timestamp };
const plan: WeeklyPlan = { id: "plan", weekStart: "2026-07-13", focusTitle: "Focus", goalId: goal.id, projectId: project.id, taskId: task.id, createdAt: timestamp, updatedAt: timestamp };

describe("today weekly plan focus", () => {
  it("uses the same Monday-starting local week key as Weekly Planning", () => {
    expect(getTodayWeekStart(new Date(2026, 6, 19))).toBe("2026-07-13");
    expect(getTodayWeekStart(new Date(2026, 6, 20))).toBe("2026-07-20");
  });

  it("keeps the weekly plan read-only while deriving the linked execution progress", () => {
    expect(getTodayWeeklyPlanFocus(plan, [goal], [project], [task, { ...task, id: "done", status: "done" }])).toMatchObject({
      plan: { id: plan.id },
      goal: { id: goal.id },
      project: { id: project.id },
      task: { id: task.id },
      linkedTaskTotal: 2,
      linkedTaskCompleted: 1,
    });
  });

  it("keeps an empty week calm and does not invent a plan", () => {
    expect(getTodayWeeklyPlanFocus(undefined, [], [], [])).toEqual({ linkedTaskTotal: 0, linkedTaskCompleted: 0 });
  });
});
