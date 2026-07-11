export const TASK_STATUS_VALUES = [
  "todo",
  "doing",
  "done",
  "deferred",
  "cancelled",
] as const;

export const PRIORITY_VALUES = ["low", "medium", "high"] as const;
export const TASK_PRIORITY_VALUES = PRIORITY_VALUES;

export const PROJECT_STATUS_VALUES = [
  "active",
  "waiting",
  "later",
  "completed",
  "archived",
] as const;
export const PROJECT_PRIORITY_VALUES = PRIORITY_VALUES;

export const MANUAL_CATEGORY_VALUES = [
  "principles",
  "values",
  "decisionRules",
  "routines",
  "preferences",
  "boundaries",
  "lessons",
  "identity",
  "other",
] as const;

export const MANUAL_STATUS_VALUES = [
  "active",
  "draft",
  "archived",
] as const;

export const MANUAL_IMPORTANCE_VALUES = PRIORITY_VALUES;

export const GOAL_AREA_VALUES = [
  "health",
  "work",
  "learning",
  "finance",
  "relationships",
  "personal",
  "other",
] as const;

export const GOAL_TIMEFRAME_VALUES = [
  "week",
  "month",
  "quarter",
  "year",
  "open",
] as const;

export const GOAL_STATUS_VALUES = [
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export const GOAL_IMPORTANCE_VALUES = PRIORITY_VALUES;

export const LEVEL_3_VALUES = ["low", "medium", "good"] as const;
export const STRESS_LEVEL_VALUES = PRIORITY_VALUES;
export const SMOKING_STATUS_VALUES = [
  "none",
  "reduced",
  "usual",
  "increased",
] as const;

export const JOURNAL_ENTRY_TYPE_VALUES = [
  "daily",
  "hard_day",
  "emotion",
  "learning",
  "project",
  "smoking",
] as const;

export const KNOWLEDGE_ITEM_TYPE_VALUES = [
  "note",
  "lesson",
  "rule",
  "checklist",
  "sop",
  "prompt",
  "resource",
  "template",
] as const;
