import { describe, expect, it } from "vitest";

import { financeObligationRecord, taskRecord } from "@/test/factories";
import {
  createCalendarIcsExportBundle,
  type CalendarExportInput,
} from "../icsExport";

describe("core calendar ICS export", () => {
  it("exports dated tasks and active finance obligations with stable entity-based UIDs", () => {
    const input: CalendarExportInput = {
      tasks: [
        {
          ...taskRecord,
          id: "task-1",
          title: "Plan the week",
          dueDate: "2026-09-28",
        },
      ],
      obligations: [
        {
          ...financeObligationRecord,
          id: "obligation-1",
          title: "Rent",
          dueDate: "2026-09-30",
          status: "active",
        },
      ],
    };

    const bundle = createCalendarIcsExportBundle(
      input,
      new Date("2026-09-26T10:20:30.000Z")
    );

    expect(bundle.eventCount).toBe(2);
    expect(bundle.findings).toEqual([]);
    expect(bundle.content).toContain("UID:task:task-1@alios.local");
    expect(bundle.content).toContain("UID:finance-obligation:obligation-1@alios.local");
    expect(bundle.content).toContain("DTSTART;VALUE=DATE:20260928");
    expect(bundle.content).toContain("DTSTART;VALUE=DATE:20260930");
    expect(bundle.content).toContain("DTSTAMP:20260926T102030Z");
  });

  it("reports ambiguous times and due-day-only obligations without guessing", () => {
    const bundle = createCalendarIcsExportBundle({
      tasks: [
        {
          ...taskRecord,
          id: "timed-task",
          title: "Timed task",
          dueDate: "2026-09-28",
          scheduledStartTime: "09:30",
        },
      ],
      obligations: [
        {
          ...financeObligationRecord,
          id: "monthly-obligation",
          title: "Monthly payment",
          dueDate: undefined,
          dueDay: 15,
          status: "active",
        },
      ],
    });

    expect(bundle.eventCount).toBe(1);
    expect(bundle.findings).toEqual([
      {
        code: "task_time_without_timezone",
        entityId: "timed-task",
        title: "Timed task",
      },
      {
        code: "finance_due_day_without_date",
        entityId: "monthly-obligation",
        title: "Monthly payment",
      },
    ]);
    expect(bundle.content).toContain("DTSTART;VALUE=DATE:20260928");
    expect(bundle.content).not.toContain("09:30");
    expect(bundle.content).not.toContain("monthly-obligation");
  });
});
