import { describe, expect, it } from "vitest";

import {
  DEFAULT_APPEARANCE_PREFERENCE,
  isAppearancePreference,
  isTimeWithinAppearanceSchedule,
  normalizeAppearanceSchedule,
  parseAppearancePreference,
  resolveAppearance,
} from "../appearance";

describe("appearance preference helpers", () => {
  it("parses only supported appearance values", () => {
    expect(DEFAULT_APPEARANCE_PREFERENCE).toBe("system");
    expect(isAppearancePreference("light")).toBe(true);
    expect(isAppearancePreference("dark")).toBe(true);
    expect(isAppearancePreference("system")).toBe(true);
    expect(isAppearancePreference("scheduled")).toBe(true);
    expect(isAppearancePreference("sepia")).toBe(false);
    expect(parseAppearancePreference("sepia")).toBe("system");
  });

  it("resolves system appearance based on the current system preference", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });

  it("resolves scheduled dark mode for ordinary and overnight windows", () => {
    expect(
      resolveAppearance(
        "scheduled",
        false,
        { start: "20:00", end: "07:00" },
        new Date("2026-08-11T21:30:00")
      )
    ).toBe("dark");
    expect(
      resolveAppearance(
        "scheduled",
        true,
        { start: "20:00", end: "07:00" },
        new Date("2026-08-11T12:00:00")
      )
    ).toBe("light");
    expect(
      isTimeWithinAppearanceSchedule(new Date("2026-08-11T14:00:00"), {
        start: "13:00",
        end: "15:00",
      })
    ).toBe(true);
  });

  it("normalizes invalid scheduled dark mode times back to safe defaults", () => {
    expect(normalizeAppearanceSchedule({ start: "99:99", end: "06:30" })).toEqual({
      start: "20:00",
      end: "06:30",
    });
  });
});
