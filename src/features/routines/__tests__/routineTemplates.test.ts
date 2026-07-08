import { describe, expect, it } from "vitest";

import {
  ROUTINE_TEMPLATES,
  getFeaturedRoutineTemplates,
  getRoutineTemplateById,
  getRoutineTemplatesByCategory,
  validateRoutineTemplateSteps,
} from "../routineTemplates";

describe("routine template helpers", () => {
  it("returns all built-in templates through the featured helper", () => {
    expect(getFeaturedRoutineTemplates().map((template) => template.id)).toEqual([
      "morningWarmup",
      "dailyPlanning",
      "studyFocus",
      "eveningReview",
    ]);
  });

  it("finds templates by id and fails safely for missing ids", () => {
    expect(getRoutineTemplateById("morningWarmup")?.id).toBe("morningWarmup");
    expect(getRoutineTemplateById("missing-template")).toBeUndefined();
  });

  it("filters templates by category", () => {
    expect(
      getRoutineTemplatesByCategory("wellness").map((template) => template.id)
    ).toEqual(["morningWarmup"]);
    expect(
      getRoutineTemplatesByCategory("planning").map((template) => template.id)
    ).toEqual(["dailyPlanning"]);
    expect(
      getRoutineTemplatesByCategory("focus").map((template) => template.id)
    ).toEqual(["studyFocus"]);
    expect(
      getRoutineTemplatesByCategory("review").map((template) => template.id)
    ).toEqual(["eveningReview"]);
  });

  it("keeps template ids unique and steps present", () => {
    const ids = ROUTINE_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const template of ROUTINE_TEMPLATES) {
      expect(template.stepKeys.length).toBeGreaterThan(0);
      expect(validateRoutineTemplateSteps(template.stepKeys)).toBe(true);
    }
  });

  it("rejects empty or duplicate step lists", () => {
    expect(validateRoutineTemplateSteps([])).toBe(false);
    expect(
      validateRoutineTemplateSteps([
        "routines.gentleMovement",
        "routines.gentleMovement",
      ])
    ).toBe(false);
  });
});
