import { describe, expect, it } from "vitest";

import {
  dismissMorningWarmupForToday,
  getLocalDateKey,
  isTimeWithinWindow,
  parseDismissedDate,
  parseMorningWarmupEnabledPreference,
  shouldShowMorningWarmupNudge,
  MORNING_WARMUP_END_MINUTES,
  MORNING_WARMUP_START_MINUTES,
} from "../routineNudges";

describe("routine nudge helpers", () => {
  it("parses stored preferences safely", () => {
    expect(parseMorningWarmupEnabledPreference("true")).toBe(true);
    expect(parseMorningWarmupEnabledPreference("false")).toBe(false);
    expect(parseMorningWarmupEnabledPreference("unexpected")).toBe(true);
    expect(parseDismissedDate("2026-07-08")).toBe("2026-07-08");
    expect(parseDismissedDate("not-a-date")).toBeUndefined();
  });

  it("checks the time window and show logic at the boundaries", () => {
    expect(
      isTimeWithinWindow(
        new Date(2026, 6, 8, 5, 0),
        MORNING_WARMUP_START_MINUTES,
        MORNING_WARMUP_END_MINUTES
      )
    ).toBe(true);
    expect(
      isTimeWithinWindow(
        new Date(2026, 6, 8, 6, 59),
        MORNING_WARMUP_START_MINUTES,
        MORNING_WARMUP_END_MINUTES
      )
    ).toBe(true);
    expect(
      isTimeWithinWindow(
        new Date(2026, 6, 8, 7, 0),
        MORNING_WARMUP_START_MINUTES,
        MORNING_WARMUP_END_MINUTES
      )
    ).toBe(false);
    expect(
      shouldShowMorningWarmupNudge(new Date(2026, 6, 8, 5, 30), {
        enabled: true,
      })
    ).toBe(true);
    expect(
      shouldShowMorningWarmupNudge(new Date(2026, 6, 8, 7, 0), {
        enabled: true,
      })
    ).toBe(false);
    expect(
      shouldShowMorningWarmupNudge(new Date(2026, 6, 8, 5, 30), {
        enabled: false,
      })
    ).toBe(false);
  });

  it("hides when dismissed today and shows again on a later day", () => {
    const today = new Date(2026, 6, 8, 6, 15);
    const tomorrow = new Date(2026, 6, 9, 6, 15);
    const dismissedToday = dismissMorningWarmupForToday(today);

    expect(getLocalDateKey(today)).toBe("2026-07-08");
    expect(dismissedToday).toBe("2026-07-08");
    expect(
      shouldShowMorningWarmupNudge(today, {
        enabled: true,
        dismissedDate: dismissedToday,
      })
    ).toBe(false);
    expect(
      shouldShowMorningWarmupNudge(tomorrow, {
        enabled: true,
        dismissedDate: dismissedToday,
      })
    ).toBe(true);
  });
});
