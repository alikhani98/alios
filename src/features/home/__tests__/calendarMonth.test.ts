import { format } from "date-fns";
import { describe, expect, it } from "vitest";

import type { Task } from "@/shared/types";

import {
  buildMonthGrid,
  buildWeekdayLabels,
  formatMonthTitle,
  groupTasksByDate,
  shiftMonth,
} from "../calendarMonth";

function createTask(id: string, dueDate?: string): Task {
  return {
    id,
    title: `Task ${id}`,
    status: "todo",
    priority: "medium",
    dueDate,
    isMit: false,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("home calendar helpers", () => {
  it("builds a fixed six-week month grid with task counts and today markers", () => {
    const groupedTasks = groupTasksByDate([
      createTask("1", "2026-07-01"),
      createTask("2", "2026-07-01"),
      createTask("3", "2026-07-14"),
    ]);

    const cells = buildMonthGrid(new Date(2026, 6, 15), groupedTasks, {
      today: new Date(2026, 6, 15),
      weekStartsOn: 0,
    });

    expect(cells).toHaveLength(42);
    expect(cells.every((cell) => cell.isoDate.length === 10)).toBe(true);

    const julyFirst = cells.find((cell) => cell.isoDate === "2026-07-01");
    expect(julyFirst?.taskCount).toBe(2);
    expect(julyFirst?.isCurrentMonth).toBe(true);
    expect(cells.some((cell) => cell.isToday)).toBe(true);
  });

  it("groups tasks by date and shifts the visible month safely", () => {
    const groupedTasks = groupTasksByDate([
      createTask("1", "2026-07-01"),
      createTask("2", "2026-07-01"),
      createTask("3", "2026-07-14"),
    ]);

    expect(groupedTasks["2026-07-01"]).toHaveLength(2);
    expect(groupedTasks["2026-07-14"]).toHaveLength(1);
    expect(groupedTasks["2026-07-02"]).toBeUndefined();
    expect(format(shiftMonth(new Date(2026, 0, 31), 1), "yyyy-MM-dd")).toBe(
      "2026-02-28"
    );
  });

  it("builds localized weekday labels and month titles", () => {
    const weekdayLabels = buildWeekdayLabels(new Date(2026, 6, 15), {
      language: "fa",
      calendar: "jalali",
    });

    expect(weekdayLabels).toHaveLength(7);
    expect(weekdayLabels.every((label) => label.length > 0)).toBe(true);
    expect(
      formatMonthTitle(new Date(2026, 6, 15), {
        language: "fa",
        calendar: "jalali",
      })
    ).not.toBe("");
  });
});
