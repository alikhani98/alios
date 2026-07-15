import { describe, expect, it } from "vitest";

import {
  createGoalsForAreaPath,
  createLifeAreaFocusPath,
  isGoalArea,
  parseGoalAreaSearchParam,
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
  });

  it("creates stable two-way area navigation paths", () => {
    expect(createGoalsForAreaPath("health")).toBe("/goals?area=health");
    expect(createLifeAreaFocusPath("health")).toBe(
      "/life-areas?focusId=health"
    );
  });
});
