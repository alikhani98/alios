import { describe, expect, it } from "vitest";
import type { Routine, Task } from "@/shared/types";
import { createRoutineTaskInput, getRoutineSuggestions } from "../routineSuggestions";

const routine: Routine = { id: "routine", title: "Morning review", weekdays: [6], priority: "medium", isActive: true, createdAt: "2026-07-01T08:00:00.000Z", updatedAt: "2026-07-01T08:00:00.000Z" };

describe("routine suggestions", () => {
  it("does not offer a routine twice on the same date", () => {
    const task = { id: "task", title: "Morning review", status: "todo", priority: "medium", dueDate: "2026-07-18", isMit: false, routineId: "routine", createdAt: "2026-07-18T08:00:00.000Z", updatedAt: "2026-07-18T08:00:00.000Z" } satisfies Task;
    expect(getRoutineSuggestions([routine], [], "2026-07-18", 6)).toEqual([routine]);
    expect(getRoutineSuggestions([routine], [task], "2026-07-18", 6)).toEqual([]);
  });
  it("creates a traceable explicit task input", () => expect(createRoutineTaskInput(routine, "2026-07-18")).toMatchObject({ routineId: "routine", dueDate: "2026-07-18", status: "todo" }));
});
