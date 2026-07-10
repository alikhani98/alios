import type { TranslationKey } from "@/shared/i18n";
import type {
  ManualEntryCategory,
  ManualEntryImportance,
  ManualEntryStatus,
} from "@/shared/types";

export const MANUAL_CATEGORY_OPTIONS: ReadonlyArray<{
  value: ManualEntryCategory | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "manual.allCategories" },
  { value: "principles", labelKey: "manual.categoryPrinciples" },
  { value: "values", labelKey: "manual.categoryValues" },
  { value: "decisionRules", labelKey: "manual.categoryDecisionRules" },
  { value: "routines", labelKey: "manual.categoryRoutines" },
  { value: "preferences", labelKey: "manual.categoryPreferences" },
  { value: "boundaries", labelKey: "manual.categoryBoundaries" },
  { value: "lessons", labelKey: "manual.categoryLessons" },
  { value: "identity", labelKey: "manual.categoryIdentity" },
  { value: "other", labelKey: "manual.categoryOther" },
];

export const MANUAL_STATUS_OPTIONS: ReadonlyArray<{
  value: ManualEntryStatus | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "manual.allStatuses" },
  { value: "active", labelKey: "manual.statusActive" },
  { value: "draft", labelKey: "manual.statusDraft" },
  { value: "archived", labelKey: "manual.statusArchived" },
];

export const MANUAL_IMPORTANCE_OPTIONS: ReadonlyArray<{
  value: ManualEntryImportance;
  labelKey: TranslationKey;
}> = [
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "high", labelKey: "common.high" },
];

export const MANUAL_STATUS_LABEL_KEYS: Record<ManualEntryStatus, TranslationKey> =
  {
    active: "manual.statusActive",
    draft: "manual.statusDraft",
    archived: "manual.statusArchived",
  };

export const MANUAL_CATEGORY_LABEL_KEYS: Record<
  ManualEntryCategory,
  TranslationKey
> = {
  principles: "manual.categoryPrinciples",
  values: "manual.categoryValues",
  decisionRules: "manual.categoryDecisionRules",
  routines: "manual.categoryRoutines",
  preferences: "manual.categoryPreferences",
  boundaries: "manual.categoryBoundaries",
  lessons: "manual.categoryLessons",
  identity: "manual.categoryIdentity",
  other: "manual.categoryOther",
};

export const MANUAL_IMPORTANCE_LABEL_KEYS: Record<
  ManualEntryImportance,
  TranslationKey
> = {
  low: "common.low",
  medium: "common.medium",
  high: "common.high",
};
