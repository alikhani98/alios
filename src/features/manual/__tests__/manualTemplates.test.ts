import { describe, expect, it } from "vitest";

import { translate } from "@/shared/i18n";
import {
  manualEntryCategorySchema,
  manualEntryImportanceSchema,
  manualEntryStatusSchema,
} from "@/shared/types";

import {
  PERSONAL_MANUAL_TEMPLATES,
  createManualEntryDraftFromTemplate,
} from "../manualTemplates";

describe("personal manual templates", () => {
  it("defines valid static template starters", () => {
    const ids = new Set<string>();

    for (const template of PERSONAL_MANUAL_TEMPLATES) {
      expect(ids.has(template.id)).toBe(false);
      ids.add(template.id);

      expect(manualEntryCategorySchema.safeParse(template.defaultCategory).success).toBe(true);
      expect(manualEntryImportanceSchema.safeParse(template.defaultImportance).success).toBe(true);
      expect(manualEntryStatusSchema.safeParse(template.defaultStatus).success).toBe(true);
      expect(template.defaultTags.length).toBeGreaterThan(0);
      expect(template.titleKey.startsWith("manual.template")).toBe(true);
      expect(template.descriptionKey.startsWith("manual.template")).toBe(true);
      expect(template.bodyScaffoldKey.startsWith("manual.template")).toBe(true);
    }

    expect(ids.size).toBe(PERSONAL_MANUAL_TEMPLATES.length);
  });

  it("builds deterministic localized drafts from templates", () => {
    for (const template of PERSONAL_MANUAL_TEMPLATES) {
      const englishDraft = createManualEntryDraftFromTemplate(template, (key) =>
        translate("en", key)
      );
      const englishRepeatDraft = createManualEntryDraftFromTemplate(template, (key) =>
        translate("en", key)
      );
      const persianDraft = createManualEntryDraftFromTemplate(template, (key) =>
        translate("fa", key)
      );

      expect(englishDraft).toEqual(englishRepeatDraft);
      expect(englishDraft.category).toBe(template.defaultCategory);
      expect(englishDraft.importance).toBe(template.defaultImportance);
      expect(englishDraft.status).toBe(template.defaultStatus);
      expect(englishDraft.tags).toEqual([...template.defaultTags]);
      expect(englishDraft.reviewIntervalDays).toBeUndefined();
      expect(englishDraft.title).toBe(translate("en", template.titleKey));
      expect(englishDraft.body).toBe(translate("en", template.bodyScaffoldKey));
      expect(englishDraft.body).toContain("\n");
      expect(persianDraft.title).toBe(translate("fa", template.titleKey));
      expect(persianDraft.body).toBe(translate("fa", template.bodyScaffoldKey));
      expect(persianDraft.tags).toEqual([...template.defaultTags]);
      expect(persianDraft.reviewIntervalDays).toBeUndefined();
    }
  });
});
