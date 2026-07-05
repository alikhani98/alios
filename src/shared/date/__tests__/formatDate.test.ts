import { describe, expect, it } from "vitest";

import { formatDisplayDate, resolveCalendar } from "../formatDate";

describe("calendar display utilities", () => {
  it("formats a Gregorian date with a stable English display", () => {
    expect(
      formatDisplayDate("2026-07-05", {
        language: "en",
        calendar: "gregorian",
      })
    ).toBe("Jul 5, 2026");
  });

  it("formats a Jalali date without mutating the stored ISO value", () => {
    const storedDate = "2026-07-05";
    const formatted = formatDisplayDate(storedDate, {
      language: "fa",
      calendar: "jalali",
    });

    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).not.toBe(storedDate);
    expect(storedDate).toBe("2026-07-05");
  });

  it("resolves automatic calendars and safely preserves invalid strings", () => {
    expect(resolveCalendar("auto", "fa")).toBe("jalali");
    expect(resolveCalendar("auto", "en")).toBe("gregorian");
    expect(
      formatDisplayDate("not-a-date", {
        language: "en",
        calendar: "gregorian",
      })
    ).toBe("not-a-date");
  });
});
