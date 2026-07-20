import { describe, expect, it } from "vitest";

import { taskRecord } from "@/test/factories";
import { createCalendarIcsExport, getCalendarExportTasks } from "../calendarIcsExport";

describe("calendar ICS export", () => {
  it("exports only scheduled active tasks as all-day VEVENT records", () => {
    const content = createCalendarIcsExport(
      [
        { ...taskRecord, id: "daily-plan", title: "Plan, review; focus", dueDate: "2026-07-20", description: "First line\nSecond line" },
        { ...taskRecord, id: "done-task", dueDate: "2026-07-21", status: "done" },
        { ...taskRecord, id: "no-date", dueDate: undefined },
      ],
      new Date("2026-07-19T12:34:56.000Z")
    );

    expect(content).toContain("BEGIN:VCALENDAR");
    expect(content).toContain("DTSTAMP:20260719T123456Z");
    expect(content).toContain("UID:daily-plan@alios.local");
    expect(content).toContain("DTSTART;VALUE=DATE:20260720");
    expect(content).toContain("DTEND;VALUE=DATE:20260721");
    expect(content).toContain("SUMMARY:Plan\\, review\\; focus");
    expect(content).toContain("DESCRIPTION:First line\\nSecond line\\n\\nCreated in AliOS.");
    expect(content).not.toContain("done-task@alios.local");
    expect(content).not.toContain("no-date@alios.local");
  });

  it("counts only tasks that can appear in an external planning calendar", () => {
    expect(
      getCalendarExportTasks([
        { ...taskRecord, dueDate: "2026-07-20" },
        { ...taskRecord, id: "done", dueDate: "2026-07-20", status: "done" },
      ])
    ).toHaveLength(1);
  });
});
