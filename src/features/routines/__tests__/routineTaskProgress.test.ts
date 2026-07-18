import { describe, expect, it } from "vitest";

import type { Routine, Task } from "@/shared/types";

import {
  createRoutineTodayTasksPath,
  createTodayTasksPath,
  findRoutineFilter,
} from "../routineTaskLinks";
import { getRoutineTaskProgress } from "../routineTaskProgress";

const routine: Routine = {
  id: "routine / one",
  title: "Morning review",
  weekdays: [1, 3, 5],
  priority: "medium",
  isActive: true,
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedAt: "2026-07-01T08:00:00.000Z",
};

function createTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    status: "todo",
    priority: "medium",
    isMit: false,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("routine task progress", () => {
  it("derives totals from linked tasks without treating cancelled tasks as open", () => {
    expect(
      getRoutineTaskProgress(routine.id, [
        createTask("done", { routineId: routine.id, status: "done" }),
        createTask("open", { routineId: routine.id, status: "doing" }),
        createTask("cancelled", { routineId: routine.id, status: "cancelled" }),
        createTask("other", { routineId: "another-routine", status: "done" }),
      ])
    ).toEqual({ total: 3, completed: 1, open: 1, completionPercent: 33 });
  });

  it("keeps a routine with no created tasks at a safe zero progress", () => {
    expect(getRoutineTaskProgress(routine.id, [])).toEqual({
      total: 0,
      completed: 0,
      open: 0,
      completionPercent: 0,
    });
  });

  it("creates stable Today filters and safely resolves unavailable routines", () => {
    expect(createRoutineTodayTasksPath(routine.id)).toBe(
      "/today?routineId=routine+%2F+one"
    );
    expect(
      createTodayTasksPath({ goalId: "goal one", projectId: "project one", routineId: routine.id })
    ).toBe("/today?goalId=goal+one&projectId=project+one&routineId=routine+%2F+one");
    expect(findRoutineFilter(routine.id, [routine])).toEqual(routine);
    expect(findRoutineFilter("deleted-routine", [routine])).toBeUndefined();
    expect(findRoutineFilter(null, [routine])).toBeUndefined();
  });
});
