import type { ProjectPriority, ProjectStatus } from "@/shared/types";
import type { TranslationKey } from "@/shared/i18n";

export const PROJECT_STATUS_OPTIONS: ReadonlyArray<{
  value: Exclude<ProjectStatus, "archived">;
  labelKey: TranslationKey;
}> = [
  { value: "active", labelKey: "common.active" },
  { value: "waiting", labelKey: "common.waiting" },
  { value: "later", labelKey: "common.later" },
  { value: "completed", labelKey: "common.completed" },
];

export const PROJECT_PRIORITY_OPTIONS: ReadonlyArray<{
  value: ProjectPriority;
  labelKey: TranslationKey;
}> = [
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "high", labelKey: "common.high" },
];

export const PROJECT_STATUS_LABEL_KEYS: Record<ProjectStatus, TranslationKey> = {
  active: "common.active",
  waiting: "common.waiting",
  later: "common.later",
  completed: "common.completed",
  archived: "common.archived",
};

export const PROJECT_PRIORITY_LABEL_KEYS: Record<ProjectPriority, TranslationKey> = {
  low: "common.low",
  medium: "common.medium",
  high: "common.high",
};
