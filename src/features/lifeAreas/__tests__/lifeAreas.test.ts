import { describe, expect, it } from "vitest";

import { translate } from "@/shared/i18n";
import { lifeAreaRecord } from "@/test/factories";

import { LIFE_AREA_DEFINITIONS } from "../constants";
import {
  filterLifeAreas,
  getAverageLifeAreaSatisfactionScore,
  getLifeAreaAttentionTone,
  getLifeAreaDefinitions,
  getLifeAreasSummary,
  getReviewDueLifeAreas,
  isLifeAreaReviewDue,
  mergeLifeAreas,
  type LifeAreaView,
} from "../lifeAreas";

function buildArea(
  overrides: Partial<LifeAreaView> & Pick<LifeAreaView, "areaKey">
): LifeAreaView {
  return {
    ...lifeAreaRecord,
    id: overrides.areaKey,
    ...overrides,
  };
}

describe("life area helpers", () => {
  it("localizes every canonical life-area definition", () => {
    const definitions = getLifeAreaDefinitions((key) => translate("en", key));

    expect(definitions).toHaveLength(LIFE_AREA_DEFINITIONS.length);
    expect(definitions.map((definition) => definition.areaKey)).toEqual(
      LIFE_AREA_DEFINITIONS.map((definition) => definition.areaKey)
    );
    expect(
      definitions.every(
        (definition) =>
          definition.title.trim().length > 0 &&
          definition.description.trim().length > 0
      )
    ).toBe(true);
  });

  it("merges persisted values into canonical defaults without mutating tags", () => {
    const persistedTags = ["sleep", "movement"];
    const persisted = {
      ...lifeAreaRecord,
      title: "",
      description: "",
      focusNote: "  protect recovery time  ",
      tags: persistedTags,
    };

    const merged = mergeLifeAreas([persisted], (key) => translate("en", key));
    const health = merged.find((area) => area.areaKey === "health");
    const work = merged.find((area) => area.areaKey === "work");

    expect(merged).toHaveLength(LIFE_AREA_DEFINITIONS.length);
    expect(health).toMatchObject({
      title: translate("en", "lifeAreas.healthTitle"),
      description: translate("en", "lifeAreas.healthDescription"),
      focusNote: "protect recovery time",
      isPersisted: true,
      isCanonical: false,
    });
    expect(health?.tags).toEqual(persistedTags);
    expect(health?.tags).not.toBe(persistedTags);
    expect(work).toMatchObject({
      areaKey: "work",
      status: "active",
      isPersisted: false,
      isCanonical: true,
    });
  });

  it("re-localizes previously persisted canonical English text without changing custom text", () => {
    const persistedCanonical = {
      ...lifeAreaRecord,
      areaKey: "health" as const,
      title: translate("en", "lifeAreas.healthTitle"),
      description: translate("en", "lifeAreas.healthDescription"),
    };
    const persistedCustom = {
      ...lifeAreaRecord,
      id: "work",
      areaKey: "work" as const,
      title: "My work balance",
      description: "A description written by the user.",
    };

    const merged = mergeLifeAreas(
      [persistedCanonical, persistedCustom],
      (key) => translate("fa", key)
    );

    expect(merged.find((area) => area.areaKey === "health")).toMatchObject({
      title: translate("fa", "lifeAreas.healthTitle"),
      description: translate("fa", "lifeAreas.healthDescription"),
      isPersisted: true,
    });
    expect(merged.find((area) => area.areaKey === "work")).toMatchObject({
      title: "My work balance",
      description: "A description written by the user.",
      isPersisted: true,
    });
  });

  it("filters by status, attention, and normalized text across area details", () => {
    const health = buildArea({
      areaKey: "health",
      status: "active",
      attentionLevel: "high",
      focusNote: "Protect a calm evening routine",
      tags: ["Sleep"],
    });
    const work = buildArea({
      areaKey: "work",
      status: "paused",
      attentionLevel: "medium",
      focusNote: "Review the launch plan",
      tags: ["release"],
    });

    expect(
      filterLifeAreas([work, health], {
        status: "active",
        attentionLevel: "high",
        query: "  EVENING   ROUTINE ",
      })
    ).toEqual([health]);
    expect(
      filterLifeAreas([work, health], {
        status: "paused",
        attentionLevel: "all",
        query: "RELEASE",
      })
    ).toEqual([work]);
  });

  it("detects review due dates from last review or update boundaries", () => {
    const referenceDate = new Date("2026-07-11T09:00:00.000Z");

    expect(isLifeAreaReviewDue(lifeAreaRecord, referenceDate)).toBe(true);
    expect(
      isLifeAreaReviewDue(
        {
          ...lifeAreaRecord,
          lastReviewedAt: undefined,
          updatedAt: "2026-07-09T08:30:00.000Z",
        },
        referenceDate
      )
    ).toBe(false);
    expect(
      isLifeAreaReviewDue(
        { ...lifeAreaRecord, status: "archived" },
        new Date("2026-08-01T09:00:00.000Z")
      )
    ).toBe(false);
    expect(
      isLifeAreaReviewDue(
        { ...lifeAreaRecord, lastReviewedAt: "not-a-date" },
        referenceDate
      )
    ).toBe(false);
    expect(
      isLifeAreaReviewDue(
        { ...lifeAreaRecord, reviewIntervalDays: undefined },
        referenceDate
      )
    ).toBe(false);
  });

  it("sorts review-due areas by their latest update", () => {
    const older = buildArea({
      areaKey: "health",
      updatedAt: "2026-07-08T08:00:00.000Z",
      lastReviewedAt: "2026-07-01T08:00:00.000Z",
      reviewIntervalDays: 3,
    });
    const newer = buildArea({
      areaKey: "work",
      updatedAt: "2026-07-10T08:00:00.000Z",
      lastReviewedAt: "2026-07-02T08:00:00.000Z",
      reviewIntervalDays: 3,
    });

    expect(
      getReviewDueLifeAreas(
        [older, newer],
        new Date("2026-07-12T12:00:00.000Z")
      ).map((area) => area.areaKey)
    ).toEqual(["work", "health"]);
  });

  it("calculates satisfaction only from recorded numeric scores", () => {
    const areas = [
      buildArea({ areaKey: "health", satisfactionScore: 5 }),
      buildArea({ areaKey: "work", satisfactionScore: 3 }),
      buildArea({ areaKey: "learning", satisfactionScore: undefined }),
    ];

    expect(getAverageLifeAreaSatisfactionScore(areas)).toBe(4);
    expect(
      getAverageLifeAreaSatisfactionScore([
        buildArea({ areaKey: "personal", satisfactionScore: undefined }),
      ])
    ).toBeNull();
  });

  it("summarizes statuses, attention, review pressure, and latest review", () => {
    const active = buildArea({
      areaKey: "health",
      status: "active",
      attentionLevel: "high",
      satisfactionScore: 5,
      lastReviewedAt: "2026-07-01T08:00:00.000Z",
      reviewIntervalDays: 3,
    });
    const paused = buildArea({
      areaKey: "work",
      status: "paused",
      attentionLevel: "medium",
      satisfactionScore: 3,
      lastReviewedAt: "2026-07-10T08:00:00.000Z",
    });
    const archived = buildArea({
      areaKey: "learning",
      status: "archived",
      attentionLevel: "low",
      satisfactionScore: undefined,
      lastReviewedAt: undefined,
    });

    const summary = getLifeAreasSummary(
      [active, paused, archived],
      new Date("2026-07-12T12:00:00.000Z")
    );

    expect(summary).toMatchObject({
      totalCount: 3,
      activeCount: 1,
      pausedCount: 1,
      archivedCount: 1,
      highAttentionActiveCount: 1,
      reviewDueCount: 1,
      averageSatisfactionScore: 4,
    });
    expect(summary.latestReviewedArea?.areaKey).toBe("work");
  });

  it("maps attention levels to stable presentation tones", () => {
    expect(getLifeAreaAttentionTone("low")).toBe("success");
    expect(getLifeAreaAttentionTone("medium")).toBe("neutral");
    expect(getLifeAreaAttentionTone("high")).toBe("warning");
  });
});
