import type {
  Level3,
  SmokingStatus,
  StressLevel,
  TaskPriority,
  TaskStatus,
} from "@/shared/types";
import type { TranslationKey } from "@/shared/i18n";

export const TASK_STATUS_OPTIONS: ReadonlyArray<{ value: TaskStatus; labelKey: TranslationKey }> = [
  { value: "todo", labelKey: "today.todo" },
  { value: "doing", labelKey: "today.doing" },
  { value: "done", labelKey: "today.done" },
  { value: "deferred", labelKey: "today.deferred" },
  { value: "cancelled", labelKey: "today.cancelled" },
];

export const TASK_STATUS_LABEL_KEYS: Record<TaskStatus, TranslationKey> = {
  todo: "today.todo",
  doing: "today.doing",
  done: "today.done",
  deferred: "today.deferred",
  cancelled: "today.cancelled",
};

export const TASK_PRIORITY_OPTIONS: ReadonlyArray<{
  value: TaskPriority;
  labelKey: TranslationKey;
}> = [
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "high", labelKey: "common.high" },
];

export const TASK_PRIORITY_LABEL_KEYS: Record<TaskPriority, TranslationKey> = {
  low: "common.low",
  medium: "common.medium",
  high: "common.high",
};

export const LEVEL_OPTIONS: ReadonlyArray<{ value: Level3; labelKey: TranslationKey }> = [
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "good", labelKey: "common.good" },
];

export const STRESS_OPTIONS: ReadonlyArray<{ value: StressLevel; labelKey: TranslationKey }> = [
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "high", labelKey: "common.high" },
];

export const SMOKING_OPTIONS: ReadonlyArray<{
  value: SmokingStatus;
  labelKey: TranslationKey;
}> = [
  { value: "none", labelKey: "today.none" },
  { value: "reduced", labelKey: "today.reduced" },
  { value: "usual", labelKey: "today.usual" },
  { value: "increased", labelKey: "today.increased" },
];
