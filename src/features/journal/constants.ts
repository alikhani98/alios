import type { JournalEntryType, Level3 } from "@/shared/types";
import type { TranslationKey } from "@/shared/i18n";

export const JOURNAL_TYPE_OPTIONS: ReadonlyArray<{
  value: JournalEntryType;
  labelKey: TranslationKey;
}> = [
  { value: "daily", labelKey: "journal.daily" },
  { value: "hard_day", labelKey: "journal.hardDay" },
  { value: "emotion", labelKey: "journal.emotion" },
  { value: "learning", labelKey: "journal.learning" },
  { value: "project", labelKey: "journal.project" },
  { value: "smoking", labelKey: "journal.smoking" },
];

export const JOURNAL_TYPE_LABEL_KEYS: Record<JournalEntryType, TranslationKey> = {
  daily: "journal.daily",
  hard_day: "journal.hardDay",
  emotion: "journal.emotion",
  learning: "journal.learning",
  project: "journal.project",
  smoking: "journal.smoking",
};

export const LEVEL_OPTIONS: ReadonlyArray<{ value: Level3; labelKey: TranslationKey }> = [
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "good", labelKey: "common.good" },
];

export const LEVEL_LABEL_KEYS: Record<Level3, TranslationKey> = {
  low: "common.low",
  medium: "common.medium",
  good: "common.good",
};
