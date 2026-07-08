import type { TranslationKey } from "@/shared/i18n";

export type RoutineTemplateCategory =
  | "wellness"
  | "planning"
  | "focus"
  | "review";

export type RoutineTemplateId =
  | "morningWarmup"
  | "dailyPlanning"
  | "studyFocus"
  | "eveningReview";

export type RoutineTemplateIconName =
  | "sunrise"
  | "calendar-check"
  | "book-open-text"
  | "moon-star";

export type RoutineTemplate = {
  id: RoutineTemplateId;
  category: RoutineTemplateCategory;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  durationKey: TranslationKey;
  stepKeys: readonly TranslationKey[];
  iconName: RoutineTemplateIconName;
  featured?: boolean;
};

const MORNING_WARMUP_STEPS = [
  "routines.gentleMovement",
  "routines.takeWaterBottle",
  "routines.startSlowly",
] as const satisfies readonly TranslationKey[];

const DAILY_PLANNING_STEPS = [
  "routines.planTopTasks",
  "routines.reviewPriorities",
  "routines.removeDistractions",
] as const satisfies readonly TranslationKey[];

const STUDY_FOCUS_STEPS = [
  "routines.focusSession",
  "routines.removeDistractions",
  "routines.planTopTasks",
] as const satisfies readonly TranslationKey[];

const EVENING_REVIEW_STEPS = [
  "routines.eveningReflection",
  "routines.whatWentWell",
  "routines.whatToImproveTomorrow",
] as const satisfies readonly TranslationKey[];

export const ROUTINE_TEMPLATES = [
  {
    id: "morningWarmup",
    category: "wellness",
    titleKey: "routines.morningWarmup",
    descriptionKey: "routines.morningWarmupDescription",
    durationKey: "routines.duration10Minutes",
    stepKeys: MORNING_WARMUP_STEPS,
    iconName: "sunrise",
    featured: true,
  },
  {
    id: "dailyPlanning",
    category: "planning",
    titleKey: "routines.dailyPlanning",
    descriptionKey: "routines.dailyPlanningDescription",
    durationKey: "routines.duration15Minutes",
    stepKeys: DAILY_PLANNING_STEPS,
    iconName: "calendar-check",
    featured: true,
  },
  {
    id: "studyFocus",
    category: "focus",
    titleKey: "routines.studyFocus",
    descriptionKey: "routines.studyFocusDescription",
    durationKey: "routines.duration25Minutes",
    stepKeys: STUDY_FOCUS_STEPS,
    iconName: "book-open-text",
    featured: true,
  },
  {
    id: "eveningReview",
    category: "review",
    titleKey: "routines.eveningReview",
    descriptionKey: "routines.eveningReviewDescription",
    durationKey: "routines.duration12Minutes",
    stepKeys: EVENING_REVIEW_STEPS,
    iconName: "moon-star",
    featured: true,
  },
] as const satisfies readonly RoutineTemplate[];

export function validateRoutineTemplateSteps(
  steps: ReadonlyArray<TranslationKey>
): boolean {
  if (steps.length === 0) {
    return false;
  }

  const uniqueSteps = new Set(steps);
  return uniqueSteps.size === steps.length;
}

export function getRoutineTemplateById(id: RoutineTemplateId | string) {
  return ROUTINE_TEMPLATES.find((template) => template.id === id);
}

export function getRoutineTemplatesByCategory(category: RoutineTemplateCategory) {
  return ROUTINE_TEMPLATES.filter((template) => template.category === category);
}

export function getFeaturedRoutineTemplates() {
  return ROUTINE_TEMPLATES.filter((template) => template.featured);
}
