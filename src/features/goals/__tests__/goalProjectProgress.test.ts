import { describe, expect, it } from "vitest";

import type { Project, Task } from "@/shared/types";

import {
  createGoalProjectsPath,
  getGoalProjectProgress,
} from "../goalProjectProgress";

const project = (id: string, status: Project["status"], goalId = "goal / one"): Project => ({
  id,
  title: id,
  status,
  priority: "medium",
  goalId,
  createdAt: "2026-07-18T08:00:00.000Z",
  updatedAt: "2026-07-18T08:00:00.000Z",
});

const task = (id: string, status: Task["status"], projectId?: string): Task => ({
  id,
  title: id,
  status,
  priority: "medium",
  isMit: false,
  projectId,
  createdAt: "2026-07-18T08:00:00.000Z",
  updatedAt: "2026-07-18T08:00:00.000Z",
});

describe("goal project progress", () => {
  it("derives goal progress from tasks in its linked projects", () => {
    expect(
      getGoalProjectProgress(
        "goal / one",
        [project("project-one", "active"), project("project-two", "completed"), project("other", "completed", "other-goal")],
        [
          task("done", "done", "project-one"),
          task("open", "doing", "project-one"),
          task("cancelled", "cancelled", "project-two"),
          task("other-task", "done", "other"),
          task("unlinked", "done"),
        ]
      )
    ).toEqual({
      projectCount: 2,
      completedProjectCount: 1,
      taskCount: 3,
      completedTaskCount: 1,
      completionPercent: 33,
    });
  });

  it("falls back to project completion and keeps a goal with no links neutral", () => {
    expect(
      getGoalProjectProgress("goal / one", [project("complete", "completed")], [])
    ).toMatchObject({
      projectCount: 1,
      completedProjectCount: 1,
      taskCount: 0,
      completionPercent: 100,
    });
    expect(getGoalProjectProgress("missing", [], [])).toEqual({
      projectCount: 0,
      completedProjectCount: 0,
      taskCount: 0,
      completedTaskCount: 0,
      completionPercent: null,
    });
  });

  it("creates a stable encoded goal-to-project filter", () => {
    expect(createGoalProjectsPath("goal / one")).toBe("/projects?goalId=goal+%2F+one");
  });
});
