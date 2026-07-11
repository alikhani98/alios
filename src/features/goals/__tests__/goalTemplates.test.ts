import { describe, expect, it } from "vitest";

import { translate } from "@/shared/i18n";
import {
  goalAreaSchema,
  goalImportanceSchema,
  goalSchema,
  goalStatusSchema,
  goalTimeframeSchema,
} from "@/shared/types";

import {
  createGoalDraftFromTemplate,
  GOAL_TEMPLATES,
} from "../goalTemplates";

function buildGoalRecord(templateId: string, draft: ReturnType<typeof createGoalDraftFromTemplate>) {
  return {
    id: `goal-${templateId}`,
    title: draft.title,
    description: draft.description,
    area: draft.area,
    timeframe: draft.timeframe,
    status: draft.status,
    importance: draft.importance,
    progressPercent: draft.progressPercent,
    targetDate: draft.targetDate,
    reviewIntervalDays: draft.reviewIntervalDays,
    lastReviewedAt: undefined,
    tags: [...draft.tags],
    createdAt: "2026-07-11T08:00:00.000Z",
    updatedAt: "2026-07-11T08:00:00.000Z",
  };
}

describe("goal templates", () => {
  it("defines valid static template starters", () => {
    const ids = new Set<string>();

    for (const template of GOAL_TEMPLATES) {
      expect(ids.has(template.id)).toBe(false);
      ids.add(template.id);

      expect(goalAreaSchema.safeParse(template.defaultArea).success).toBe(true);
      expect(goalTimeframeSchema.safeParse(template.defaultTimeframe).success).toBe(true);
      expect(goalStatusSchema.safeParse("active").success).toBe(true);
      expect(goalImportanceSchema.safeParse(template.defaultImportance).success).toBe(true);
      expect(template.defaultProgressPercent).toBeGreaterThanOrEqual(0);
      expect(template.defaultProgressPercent).toBeLessThanOrEqual(100);
      expect(template.defaultTags.length).toBeGreaterThan(0);
      expect(template.defaultTags.every((tag) => tag.trim().length > 0)).toBe(true);
      expect(template.titleKey.startsWith("goals.template")).toBe(true);
      expect(template.descriptionKey.startsWith("goals.template")).toBe(true);
      expect(template.bodyScaffoldKey.startsWith("goals.template")).toBe(true);
      if (template.defaultReviewIntervalDays !== undefined) {
        expect(template.defaultReviewIntervalDays).toBeGreaterThan(0);
      }
    }
  });

  it("builds valid localized goal drafts from templates", () => {
    for (const template of GOAL_TEMPLATES) {
      const englishDraft = createGoalDraftFromTemplate(template, (key) =>
        translate("en", key)
      );
      const persianDraft = createGoalDraftFromTemplate(template, (key) =>
        translate("fa", key)
      );

      expect(englishDraft.title).toBe(translate("en", template.titleKey));
      expect(englishDraft.description).toBe(translate("en", template.bodyScaffoldKey));
      expect(englishDraft.tags).toEqual([...template.defaultTags]);
      expect(englishDraft.targetDate).toBeUndefined();
      expect(englishDraft.reviewIntervalDays).toBe(template.defaultReviewIntervalDays);

      expect(persianDraft.title).toBe(translate("fa", template.titleKey));
      expect(persianDraft.description).toBe(translate("fa", template.bodyScaffoldKey));
      expect(persianDraft.tags).toEqual([...template.defaultTags]);
      expect(persianDraft.targetDate).toBeUndefined();
      expect(persianDraft.reviewIntervalDays).toBe(template.defaultReviewIntervalDays);

      expect(goalSchema.safeParse(buildGoalRecord(template.id, englishDraft)).success).toBe(true);
      expect(goalSchema.safeParse(buildGoalRecord(template.id, persianDraft)).success).toBe(true);
    }
  });
});
