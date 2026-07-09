import { describe, expect, it } from "vitest";

import {
  WELLNESS_BADMINTON_ROUTINE_SECTIONS,
  WELLNESS_BADMINTON_ROUTINE_TEMPLATE,
  createDefaultWellnessRoutineDailyState,
  getWellnessRoutineDailyState,
  isWellnessRoutineEnabled,
  normalizeWellnessRoutineCheckedStepIds,
  parseWellnessRoutineEnergyLevel,
  parseWellnessRoutineFatigueLevel,
  parseWellnessRoutineCheckedStepIds,
  saveWellnessRoutineDailyState,
  toggleWellnessRoutineStepId,
  WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
} from "../badmintonRoutine";

describe("wellness badminton routine helpers", () => {
  it("creates a default daily state for a given date", () => {
    expect(createDefaultWellnessRoutineDailyState("2026-07-09")).toEqual({
      date: "2026-07-09",
      checkedStepIds: [],
      energy: null,
      fatigue: null,
    });
  });

  it("resets the daily state when the stored date changes", () => {
    expect(
      getWellnessRoutineDailyState({
        currentDate: "2026-07-09",
        storedDate: "2026-07-08",
        storedCheckedStepIds: JSON.stringify([
          "gentleShoulderMovement",
        ]),
        storedEnergy: "good",
        storedFatigue: "medium",
      })
    ).toEqual({
      date: "2026-07-09",
      checkedStepIds: [],
      energy: null,
      fatigue: null,
    });
  });

  it("toggles checklist step ids safely", () => {
    expect(
      toggleWellnessRoutineStepId([], "gentleShoulderMovement")
    ).toEqual(["gentleShoulderMovement"]);
    expect(
      toggleWellnessRoutineStepId(
        ["gentleShoulderMovement", "gentleShoulderMovement"],
        "gentleShoulderMovement"
      )
    ).toEqual([]);
    expect(
      toggleWellnessRoutineStepId(
        ["gentleShoulderMovement", "unknown-step"],
        "unknown-step"
      )
    ).toEqual(["gentleShoulderMovement"]);
  });

  it("preserves only known step ids in a stable order", () => {
    expect(
      normalizeWellnessRoutineCheckedStepIds([
        "shortBreak",
        "bad-id",
        "waterNearby",
        "shortBreak",
      ])
    ).toEqual(["waterNearby", "shortBreak"]);
  });

  it("validates reflection levels safely", () => {
    expect(parseWellnessRoutineEnergyLevel("low")).toBe("low");
    expect(parseWellnessRoutineEnergyLevel("okay")).toBe("okay");
    expect(parseWellnessRoutineEnergyLevel("bad")).toBeNull();

    expect(parseWellnessRoutineFatigueLevel("medium")).toBe("medium");
    expect(parseWellnessRoutineFatigueLevel("high")).toBe("high");
    expect(parseWellnessRoutineFatigueLevel("bad")).toBeNull();
  });

  it("parses checklist state safely", () => {
    expect(
      parseWellnessRoutineCheckedStepIds(
        JSON.stringify(["startSlowly", "startSlowly", "nope"])
      )
    ).toEqual(["startSlowly"]);
    expect(parseWellnessRoutineCheckedStepIds("not-json")).toEqual([]);
  });

  it("treats the wellness card preference as a simple local toggle", () => {
    expect(isWellnessRoutineEnabled(true)).toBe(true);
    expect(isWellnessRoutineEnabled(false)).toBe(false);
  });

  it("keeps the required sections and step ids unique", () => {
    expect(WELLNESS_BADMINTON_ROUTINE_SECTIONS.map((section) => section.id)).toEqual([
      "beforePlay",
      "duringPlay",
      "afterPlay",
      "reflection",
    ]);

    const allStepIds = WELLNESS_BADMINTON_ROUTINE_TEMPLATE.stepKeys;
    expect(new Set(allStepIds).size).toBe(allStepIds.length);
    expect(allStepIds.length).toBeGreaterThan(0);
    expect(WELLNESS_BADMINTON_ROUTINE_TEMPLATE.id).toBe("parkBadmintonRoutine");
  });

  it("keeps the storage keys stable for the local-only daily state", () => {
    expect(WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY).toBe(
      "alios.wellness.badmintonRoutine.date"
    );
    expect(WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY).toBe(
      "alios.wellness.badmintonRoutine.checkedSteps"
    );
  });

  it("fails safely when storage is unavailable", () => {
    expect(
      saveWellnessRoutineDailyState(null, {
        date: "2026-07-09",
        checkedStepIds: [],
        energy: null,
        fatigue: null,
      })
    ).toBe(false);
  });
});
