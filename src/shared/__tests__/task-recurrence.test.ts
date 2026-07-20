import { describe, expect, it } from "vitest";

import { taskRecord } from "@/test/factories";
import { getNextTaskRecurrenceDate } from "../task-recurrence";

describe("task recurrence", () => {
  it("calculates daily and weekly occurrences from the canonical ISO due date", () => {
    expect(
      getNextTaskRecurrenceDate({
        ...taskRecord,
        dueDate: "2026-07-19",
        recurrence: { frequency: "daily" },
      })
    ).toBe("2026-07-20");
    expect(
      getNextTaskRecurrenceDate({
        ...taskRecord,
        dueDate: "2026-07-19",
        recurrence: { frequency: "weekly" },
      })
    ).toBe("2026-07-26");
  });

  it("does not schedule a task without a recurrence and date", () => {
    expect(getNextTaskRecurrenceDate(taskRecord)).toBeUndefined();
    expect(
      getNextTaskRecurrenceDate({
        ...taskRecord,
        dueDate: undefined,
        recurrence: { frequency: "daily" },
      })
    ).toBeUndefined();
  });
});
