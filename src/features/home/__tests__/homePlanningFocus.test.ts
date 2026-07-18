import { describe, expect, it } from "vitest";

import type { Goal, Project, Task } from "@/shared/types";

import { getHomePlanningFocus } from "../homePlanningFocus";

const timestamp = "2026-07-10T08:00:00.000Z";

function goal(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    title: id,
    description: id,
    area: "personal",
    timeframe: "month",
    status: "active",
    importance: "medium",
    progressPercent: 25,
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function project(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    title: id,
    status: "active",
    priority: "medium",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    status: "todo",
    priority: "medium",
    isMit: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe("home planning focus", () => {
  it("prioritizes a review-due high-importance goal and its actionable chain", () => {
    const selectedGoal = goal("selected", {
      importance: "high",
      reviewIntervalDays: 7,
      lastReviewedAt: "2026-06-30T08:00:00.000Z",
    });
    const focus = getHomePlanningFocus(
      [goal("other"), selectedGoal],
      [project("project", { goalId: selectedGoal.id }), project("other-project", { goalId: "other" })],
      [task("ordinary", { projectId: "project" }), task("mit", { projectId: "project", isMit: true })],
      new Date(2026, 6, 10)
    );

    expect(focus).toMatchObject({
      goal: { id: "selected" },
      project: { id: "project" },
      task: { id: "mit" },
    });
  });

  it("keeps an empty or unlinked planning area safe", () => {
    expect(getHomePlanningFocus([], [], [])).toBeUndefined();
    expect(getHomePlanningFocus([goal("standalone")], [], [])).toMatchObject({
      goal: { id: "standalone" },
      project: undefined,
      task: undefined,
    });
  });
});
