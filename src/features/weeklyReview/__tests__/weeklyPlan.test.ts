import { describe, expect, it } from "vitest";

import { getPreviousWeeklyPlanWeekStart, getWeeklyPlanWeekStart } from "../weeklyPlan";

describe("weekly plan week keys", () => {
  it("keeps the prior plan on the Monday before the current plan", () => {
    const sunday = new Date(2026, 6, 19);

    expect(getWeeklyPlanWeekStart(sunday)).toBe("2026-07-13");
    expect(getPreviousWeeklyPlanWeekStart(sunday)).toBe("2026-07-06");
  });
});
