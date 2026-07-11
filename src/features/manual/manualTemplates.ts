import type { TranslationKey } from "@/shared/i18n";
import type {
  ManualEntryCategory,
  ManualEntryImportance,
  ManualEntryStatus,
} from "@/shared/types";

import type { ManualEntryFormSeed } from "./types";

export type ManualTemplateDefinition = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  bodyScaffoldKey: TranslationKey;
  defaultCategory: ManualEntryCategory;
  defaultImportance: ManualEntryImportance;
  defaultStatus: ManualEntryStatus;
  defaultTags: readonly string[];
};

export const PERSONAL_MANUAL_TEMPLATES = [
  {
    id: "personal-principle",
    titleKey: "manual.templatePersonalPrinciple",
    descriptionKey: "manual.templatePersonalPrincipleDescription",
    bodyScaffoldKey: "manual.templatePersonalPrincipleBody",
    defaultCategory: "principles",
    defaultImportance: "medium",
    defaultStatus: "active",
    defaultTags: ["principle", "reference"],
  },
  {
    id: "decision-rule",
    titleKey: "manual.templateDecisionRule",
    descriptionKey: "manual.templateDecisionRuleDescription",
    bodyScaffoldKey: "manual.templateDecisionRuleBody",
    defaultCategory: "decisionRules",
    defaultImportance: "high",
    defaultStatus: "active",
    defaultTags: ["decision", "rule"],
  },
  {
    id: "boundary",
    titleKey: "manual.templateBoundary",
    descriptionKey: "manual.templateBoundaryDescription",
    bodyScaffoldKey: "manual.templateBoundaryBody",
    defaultCategory: "boundaries",
    defaultImportance: "high",
    defaultStatus: "active",
    defaultTags: ["boundary", "protection"],
  },
  {
    id: "lesson-learned",
    titleKey: "manual.templateLessonLearned",
    descriptionKey: "manual.templateLessonLearnedDescription",
    bodyScaffoldKey: "manual.templateLessonLearnedBody",
    defaultCategory: "lessons",
    defaultImportance: "medium",
    defaultStatus: "active",
    defaultTags: ["lesson", "reflection"],
  },
  {
    id: "work-preference",
    titleKey: "manual.templateWorkPreference",
    descriptionKey: "manual.templateWorkPreferenceDescription",
    bodyScaffoldKey: "manual.templateWorkPreferenceBody",
    defaultCategory: "preferences",
    defaultImportance: "medium",
    defaultStatus: "active",
    defaultTags: ["work", "preference"],
  },
  {
    id: "routine-note",
    titleKey: "manual.templateRoutineNote",
    descriptionKey: "manual.templateRoutineNoteDescription",
    bodyScaffoldKey: "manual.templateRoutineNoteBody",
    defaultCategory: "routines",
    defaultImportance: "medium",
    defaultStatus: "active",
    defaultTags: ["routine", "habit"],
  },
  {
    id: "value-statement",
    titleKey: "manual.templateValueStatement",
    descriptionKey: "manual.templateValueStatementDescription",
    bodyScaffoldKey: "manual.templateValueStatementBody",
    defaultCategory: "values",
    defaultImportance: "medium",
    defaultStatus: "active",
    defaultTags: ["value", "reference"],
  },
  {
    id: "energy-focus-rule",
    titleKey: "manual.templateEnergyFocusRule",
    descriptionKey: "manual.templateEnergyFocusRuleDescription",
    bodyScaffoldKey: "manual.templateEnergyFocusRuleBody",
    defaultCategory: "principles",
    defaultImportance: "high",
    defaultStatus: "active",
    defaultTags: ["energy", "focus"],
  },
  {
    id: "finance-rule",
    titleKey: "manual.templateFinanceRule",
    descriptionKey: "manual.templateFinanceRuleDescription",
    bodyScaffoldKey: "manual.templateFinanceRuleBody",
    defaultCategory: "decisionRules",
    defaultImportance: "high",
    defaultStatus: "active",
    defaultTags: ["finance", "rule"],
  },
  {
    id: "health-rule",
    titleKey: "manual.templateHealthRule",
    descriptionKey: "manual.templateHealthRuleDescription",
    bodyScaffoldKey: "manual.templateHealthRuleBody",
    defaultCategory: "principles",
    defaultImportance: "medium",
    defaultStatus: "active",
    defaultTags: ["health", "reference"],
  },
  {
    id: "other-manual-note",
    titleKey: "manual.templateOtherManualNote",
    descriptionKey: "manual.templateOtherManualNoteDescription",
    bodyScaffoldKey: "manual.templateOtherManualNoteBody",
    defaultCategory: "other",
    defaultImportance: "low",
    defaultStatus: "draft",
    defaultTags: ["manual", "note"],
  },
] as const satisfies ReadonlyArray<ManualTemplateDefinition>;

export function createManualEntryDraftFromTemplate(
  template: ManualTemplateDefinition,
  t: (key: TranslationKey) => string
): ManualEntryFormSeed {
  return {
    title: t(template.titleKey),
    body: t(template.bodyScaffoldKey),
    category: template.defaultCategory,
    importance: template.defaultImportance,
    status: template.defaultStatus,
    tags: [...template.defaultTags],
    reviewIntervalDays: undefined,
  };
}
