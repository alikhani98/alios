import { describe, expect, it } from "vitest";

import type { Task } from "@/shared/types";

import { buildTaskTimeline } from "../taskTimeline";

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

describe("task timeline helpers", () => {
  it("groups tasks into overdue, today, tomorrow, this week, and later", () => {
    const timeline = buildTaskTimeline(
      [
        createTask("overdue", "2026-07-07"),
        createTask("today", "2026-07-08"),
        createTask("tomorrow", "2026-07-09"),
        createTask("this-week", "2026-07-15"),
        createTask("later", "2026-07-16"),
        createTask("done", "2026-07-08", { status: "done" }),
      ],
      new Date(2026, 6, 8)
    );

    expect(timeline.overdue.map((task) => task.id)).toEqual(["overdue"]);
    expect(timeline.today.map((task) => task.id)).toEqual(["today"]);
    expect(timeline.tomorrow.map((task) => task.id)).toEqual(["tomorrow"]);
    expect(timeline.thisWeek.map((task) => task.id)).toEqual(["this-week"]);
    expect(timeline.later.map((task) => task.id)).toEqual(["later"]);
  });

  it("skips invalid or missing due dates safely", () => {
    const timeline = buildTaskTimeline(
      [
        createTask("missing"),
        createTask("invalid", "2026-13-40"),
        createTask("valid", "2026-07-08"),
      ],
      new Date(2026, 6, 8)
    );

    expect(timeline.today.map((task) => task.id)).toEqual(["valid"]);
    expect(timeline.overdue).toHaveLength(0);
    expect(timeline.tomorrow).toHaveLength(0);
    expect(timeline.thisWeek).toHaveLength(0);
    expect(timeline.later).toHaveLength(0);
  });

  it("sorts tasks stably by due date and recency within each bucket", () => {
    const timeline = buildTaskTimeline(
      [
        createTask("oldest", "2026-07-08", {
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-02T00:00:00.000Z",
        }),
        createTask("middle", "2026-07-08", {
          createdAt: "2026-07-02T00:00:00.000Z",
          updatedAt: "2026-07-03T00:00:00.000Z",
        }),
        createTask("newest", "2026-07-08", {
          createdAt: "2026-07-03T00:00:00.000Z",
          updatedAt: "2026-07-04T00:00:00.000Z",
        }),
      ],
      new Date(2026, 6, 8)
    );

    expect(timeline.today.map((task) => task.id)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });
});
