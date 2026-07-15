import { describe, expect, it } from "vitest";

import { GOAL_AREA_VALUES } from "@/shared/constants/domain";

import {
  createGoalsForAreaPath,
  createLifeAreaFocusPath,
  isGoalArea,
  parseGoalAreaSearchParam,
  parseLifeAreaFocusSearchParam,
  updateGoalAreaSearchParams,
} from "../goalAreaNavigation";

describe("goal area navigation", () => {
  it("accepts every supported goal area", () => {
    expect(
      [
        "health",
        "work",
        "learning",
        "finance",
        "relationships",
        "personal",
        "other",
      ].every(isGoalArea)
    ).toBe(true);
    expect(parseGoalAreaSearchParam("health")).toBe("health");
  });

  it("ignores missing and unsupported area parameters", () => {
    expect(parseGoalAreaSearchParam(null)).toBe("all");
    expect(parseGoalAreaSearchParam("unsupported-area")).toBe("all");
    expect(parseLifeAreaFocusSearchParam(null)).toBeNull();
    expect(parseLifeAreaFocusSearchParam("unsupported-area")).toBeNull();
  });

  it("creates stable two-way area navigation paths", () => {
    for (const area of GOAL_AREA_VALUES) {
      expect(createGoalsForAreaPath(area)).toBe(`/goals?area=${area}`);
      expect(createLifeAreaFocusPath(area)).toBe(
        `/life-areas?focusId=${area}`
      );
      expect(parseGoalAreaSearchParam(area)).toBe(area);
      expect(parseLifeAreaFocusSearchParam(area)).toBe(area);
    }
  });

  it("updates the area filter without dropping unrelated parameters", () => {
    const current = new URLSearchParams("focusId=goal-1&query=sleep");
    const next = updateGoalAreaSearchParams(current, "health");

    expect(next.get("area")).toBe("health");
    expect(next.get("focusId")).toBe("goal-1");
    expect(next.get("query")).toBe("sleep");
    expect(current.has("area")).toBe(false);
  });

  it("clears only the area filter when all areas are selected", () => {
    const next = updateGoalAreaSearchParams(
      new URLSearchParams("area=finance&focusId=goal-1"),
      "all"
    );

    expect(next.has("area")).toBe(false);
    expect(next.get("focusId")).toBe("goal-1");
  });
});
