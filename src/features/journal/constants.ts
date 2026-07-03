import type { JournalEntryType, Level3 } from "@/shared/types";

export const JOURNAL_TYPE_OPTIONS: ReadonlyArray<{
  value: JournalEntryType;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "hard_day", label: "Hard day" },
  { value: "emotion", label: "Emotion" },
  { value: "learning", label: "Learning" },
  { value: "project", label: "Project" },
  { value: "smoking", label: "Smoking" },
];

export const JOURNAL_TYPE_LABELS: Record<JournalEntryType, string> = {
  daily: "Daily",
  hard_day: "Hard day",
  emotion: "Emotion",
  learning: "Learning",
  project: "Project",
  smoking: "Smoking",
};

export const LEVEL_OPTIONS: ReadonlyArray<{ value: Level3; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "good", label: "Good" },
];

export const LEVEL_LABELS: Record<Level3, string> = {
  low: "Low",
  medium: "Medium",
  good: "Good",
};
