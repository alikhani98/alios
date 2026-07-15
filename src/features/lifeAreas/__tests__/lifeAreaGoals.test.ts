import { describe, expect, it } from "vitest";

import { goalRecord } from "@/test/factories";

import { getLifeAreaGoalSummary } from "../lifeAreaGoals";

describe("life area goal summaries", () => {
  it("summarizes goals linked through the shared area key", () => {
    const summary = getLifeAreaGoalSummary(
      [
        { ...goalRecord, id: "active-1", area: "health", progressPercent: 20 },
        { ...goalRecord, id: "active-2", area: "health", progressPercent: 60 },
        {
          ...goalRecord,
          id: "completed",
          area: "health",
          status: "completed",
          progressPercent: 100,
        },
        { ...goalRecord, id: "work", area: "work", progressPercent: 90 },
      ],
      "health"
    );

    expect(summary).toEqual({
      totalCount: 3,
      activeCount: 2,
      completedCount: 1,
      averageActiveProgress: 40,
    });
  });

  it("excludes paused and archived goals from active progress", () => {
    const summary = getLifeAreaGoalSummary(
      [
        {
          ...goalRecord,
          id: "paused",
          area: "finance",
          status: "paused",
          progressPercent: 80,
        },
        {
          ...goalRecord,
          id: "archived",
          area: "finance",
          status: "archived",
          progressPercent: 90,
        },
      ],
      "finance"
    );

    expect(summary).toEqual({
      totalCount: 2,
      activeCount: 0,
      completedCount: 0,
      averageActiveProgress: null,
    });
  });

  it("returns a stable empty summary when an area has no goals", () => {
    expect(getLifeAreaGoalSummary([], "relationships")).toEqual({
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
      averageActiveProgress: null,
    });
  });

  it("does not mutate the source goal list", () => {
    const goals = [
      { ...goalRecord, id: "first", area: "personal" as const },
      { ...goalRecord, id: "second", area: "personal" as const },
    ];
    const originalIds = goals.map((goal) => goal.id);

    getLifeAreaGoalSummary(goals, "personal");

    expect(goals.map((goal) => goal.id)).toEqual(originalIds);
  });
});
