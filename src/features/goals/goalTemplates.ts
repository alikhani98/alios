import type { TranslationKey } from "@/shared/i18n";
import type {
  GoalArea,
  GoalImportance,
  GoalTimeframe,
} from "@/shared/types";

import type { GoalFormSeed } from "./types";

export type GoalTemplateDefinition = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  bodyScaffoldKey: TranslationKey;
  defaultArea: GoalArea;
  defaultTimeframe: GoalTimeframe;
  defaultImportance: GoalImportance;
  defaultProgressPercent: number;
  defaultTags: readonly string[];
  defaultReviewIntervalDays?: number;
};

export const GOAL_TEMPLATES = [
  {
    id: "health-goal",
    titleKey: "goals.templateHealthGoal",
    descriptionKey: "goals.templateHealthGoalDescription",
    bodyScaffoldKey: "goals.templateHealthGoalBody",
    defaultArea: "health",
    defaultTimeframe: "month",
    defaultImportance: "medium",
    defaultProgressPercent: 10,
    defaultTags: ["health", "routine"],
    defaultReviewIntervalDays: 7,
  },
  {
    id: "learning-goal",
    titleKey: "goals.templateLearningGoal",
    descriptionKey: "goals.templateLearningGoalDescription",
    bodyScaffoldKey: "goals.templateLearningGoalBody",
    defaultArea: "learning",
    defaultTimeframe: "quarter",
    defaultImportance: "medium",
    defaultProgressPercent: 0,
    defaultTags: ["learning", "study"],
    defaultReviewIntervalDays: 14,
  },
  {
    id: "work-goal",
    titleKey: "goals.templateWorkGoal",
    descriptionKey: "goals.templateWorkGoalDescription",
    bodyScaffoldKey: "goals.templateWorkGoalBody",
    defaultArea: "work",
    defaultTimeframe: "month",
    defaultImportance: "high",
    defaultProgressPercent: 25,
    defaultTags: ["work", "focus"],
    defaultReviewIntervalDays: 7,
  },
  {
    id: "finance-goal",
    titleKey: "goals.templateFinanceGoal",
    descriptionKey: "goals.templateFinanceGoalDescription",
    bodyScaffoldKey: "goals.templateFinanceGoalBody",
    defaultArea: "finance",
    defaultTimeframe: "month",
    defaultImportance: "high",
    defaultProgressPercent: 0,
    defaultTags: ["finance", "stability"],
    defaultReviewIntervalDays: 30,
  },
  {
    id: "relationship-goal",
    titleKey: "goals.templateRelationshipGoal",
    descriptionKey: "goals.templateRelationshipGoalDescription",
    bodyScaffoldKey: "goals.templateRelationshipGoalBody",
    defaultArea: "relationships",
    defaultTimeframe: "quarter",
    defaultImportance: "medium",
    defaultProgressPercent: 20,
    defaultTags: ["relationships", "connection"],
    defaultReviewIntervalDays: 14,
  },
  {
    id: "personal-growth-goal",
    titleKey: "goals.templatePersonalGrowthGoal",
    descriptionKey: "goals.templatePersonalGrowthGoalDescription",
    bodyScaffoldKey: "goals.templatePersonalGrowthGoalBody",
    defaultArea: "personal",
    defaultTimeframe: "quarter",
    defaultImportance: "medium",
    defaultProgressPercent: 15,
    defaultTags: ["growth", "personal"],
    defaultReviewIntervalDays: 14,
  },
  {
    id: "weekly-goal",
    titleKey: "goals.templateWeeklyGoal",
    descriptionKey: "goals.templateWeeklyGoalDescription",
    bodyScaffoldKey: "goals.templateWeeklyGoalBody",
    defaultArea: "personal",
    defaultTimeframe: "week",
    defaultImportance: "medium",
    defaultProgressPercent: 50,
    defaultTags: ["weekly", "focus"],
    defaultReviewIntervalDays: 7,
  },
  {
    id: "monthly-goal",
    titleKey: "goals.templateMonthlyGoal",
    descriptionKey: "goals.templateMonthlyGoalDescription",
    bodyScaffoldKey: "goals.templateMonthlyGoalBody",
    defaultArea: "personal",
    defaultTimeframe: "month",
    defaultImportance: "medium",
    defaultProgressPercent: 20,
    defaultTags: ["monthly", "plan"],
    defaultReviewIntervalDays: 30,
  },
  {
    id: "quarterly-goal",
    titleKey: "goals.templateQuarterlyGoal",
    descriptionKey: "goals.templateQuarterlyGoalDescription",
    bodyScaffoldKey: "goals.templateQuarterlyGoalBody",
    defaultArea: "work",
    defaultTimeframe: "quarter",
    defaultImportance: "high",
    defaultProgressPercent: 10,
    defaultTags: ["quarter", "review"],
    defaultReviewIntervalDays: 90,
  },
  {
    id: "yearly-goal",
    titleKey: "goals.templateYearlyGoal",
    descriptionKey: "goals.templateYearlyGoalDescription",
    bodyScaffoldKey: "goals.templateYearlyGoalBody",
    defaultArea: "personal",
    defaultTimeframe: "year",
    defaultImportance: "high",
    defaultProgressPercent: 0,
    defaultTags: ["yearly", "vision"],
    defaultReviewIntervalDays: 365,
  },
  {
    id: "open-ended-goal",
    titleKey: "goals.templateOpenEndedGoal",
    descriptionKey: "goals.templateOpenEndedGoalDescription",
    bodyScaffoldKey: "goals.templateOpenEndedGoalBody",
    defaultArea: "other",
    defaultTimeframe: "open",
    defaultImportance: "medium",
    defaultProgressPercent: 0,
    defaultTags: ["open-ended", "flexible"],
    defaultReviewIntervalDays: 14,
  },
  {
    id: "review-habit-goal",
    titleKey: "goals.templateReviewHabitGoal",
    descriptionKey: "goals.templateReviewHabitGoalDescription",
    bodyScaffoldKey: "goals.templateReviewHabitGoalBody",
    defaultArea: "personal",
    defaultTimeframe: "week",
    defaultImportance: "medium",
    defaultProgressPercent: 5,
    defaultTags: ["review", "habit"],
    defaultReviewIntervalDays: 7,
  },
] as const satisfies ReadonlyArray<GoalTemplateDefinition>;

export function previewGoalTemplateBody(value: string): string {
  const firstLine = value.split("\n")[0].trim();
  if (firstLine.length <= 88) {
    return firstLine;
  }

  return `${firstLine.slice(0, 88)}…`;
}

export function createGoalDraftFromTemplate(
  template: GoalTemplateDefinition,
  t: (key: TranslationKey) => string
): GoalFormSeed {
  return {
    title: t(template.titleKey),
    description: t(template.bodyScaffoldKey),
    area: template.defaultArea,
    timeframe: template.defaultTimeframe,
    status: "active",
    importance: template.defaultImportance,
    progressPercent: template.defaultProgressPercent,
    targetDate: undefined,
    reviewIntervalDays: template.defaultReviewIntervalDays,
    tags: [...template.defaultTags],
  };
}
