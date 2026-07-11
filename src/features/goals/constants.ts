import type { TranslationKey } from "@/shared/i18n";
import type {
  GoalArea,
  GoalImportance,
  GoalStatus,
  GoalTimeframe,
} from "@/shared/types";

export const GOAL_AREA_OPTIONS: ReadonlyArray<{
  value: GoalArea | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "goals.allAreas" },
  { value: "health", labelKey: "goals.areaHealth" },
  { value: "work", labelKey: "goals.areaWork" },
  { value: "learning", labelKey: "goals.areaLearning" },
  { value: "finance", labelKey: "goals.areaFinance" },
  { value: "relationships", labelKey: "goals.areaRelationships" },
  { value: "personal", labelKey: "goals.areaPersonal" },
  { value: "other", labelKey: "goals.areaOther" },
];

export const GOAL_TIMEFRAME_OPTIONS: ReadonlyArray<{
  value: GoalTimeframe | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "goals.allTimeframes" },
  { value: "week", labelKey: "goals.timeframeWeek" },
  { value: "month", labelKey: "goals.timeframeMonth" },
  { value: "quarter", labelKey: "goals.timeframeQuarter" },
  { value: "year", labelKey: "goals.timeframeYear" },
  { value: "open", labelKey: "goals.timeframeOpen" },
];

export const GOAL_STATUS_OPTIONS: ReadonlyArray<{
  value: GoalStatus | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "goals.allStatuses" },
  { value: "active", labelKey: "goals.statusActive" },
  { value: "paused", labelKey: "goals.statusPaused" },
  { value: "completed", labelKey: "goals.statusCompleted" },
  { value: "archived", labelKey: "goals.statusArchived" },
];

export const GOAL_IMPORTANCE_OPTIONS: ReadonlyArray<{
  value: GoalImportance | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "goals.allImportance" },
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "high", labelKey: "common.high" },
];

export const GOAL_AREA_LABEL_KEYS: Record<GoalArea, TranslationKey> = {
  health: "goals.areaHealth",
  work: "goals.areaWork",
  learning: "goals.areaLearning",
  finance: "goals.areaFinance",
  relationships: "goals.areaRelationships",
  personal: "goals.areaPersonal",
  other: "goals.areaOther",
};

export const GOAL_TIMEFRAME_LABEL_KEYS: Record<GoalTimeframe, TranslationKey> = {
  week: "goals.timeframeWeek",
  month: "goals.timeframeMonth",
  quarter: "goals.timeframeQuarter",
  year: "goals.timeframeYear",
  open: "goals.timeframeOpen",
};

export const GOAL_STATUS_LABEL_KEYS: Record<GoalStatus, TranslationKey> = {
  active: "goals.statusActive",
  paused: "goals.statusPaused",
  completed: "goals.statusCompleted",
  archived: "goals.statusArchived",
};

export const GOAL_IMPORTANCE_LABEL_KEYS: Record<GoalImportance, TranslationKey> = {
  low: "common.low",
  medium: "common.medium",
  high: "common.high",
};
