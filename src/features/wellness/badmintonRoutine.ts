import type { TranslationKey } from "@/shared/i18n";

export const WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY =
  "alios.wellness.badmintonRoutine.enabled";
export const WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY =
  "alios.wellness.badmintonRoutine.date";
export const WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY =
  "alios.wellness.badmintonRoutine.checkedSteps";
export const WELLNESS_BADMINTON_ROUTINE_ENERGY_STORAGE_KEY =
  "alios.wellness.badmintonRoutine.energy";
export const WELLNESS_BADMINTON_ROUTINE_FATIGUE_STORAGE_KEY =
  "alios.wellness.badmintonRoutine.fatigue";

export const WELLNESS_BADMINTON_ROUTINE_TEMPLATE_ID =
  "parkBadmintonRoutine" as const;

export type WellnessBadmintonRoutineTemplateId =
  typeof WELLNESS_BADMINTON_ROUTINE_TEMPLATE_ID;

export type WellnessRoutineSectionId =
  | "beforePlay"
  | "duringPlay"
  | "afterPlay"
  | "reflection";

export type WellnessRoutineEnergyLevel = "low" | "okay" | "good";
export type WellnessRoutineFatigueLevel = "low" | "medium" | "high";

export type WellnessRoutineStepId =
  | "gentleShoulderMovement"
  | "gentleWristMovement"
  | "gentleAnkleMovement"
  | "lightWalking"
  | "waterNearby"
  | "startSlowly"
  | "shortBreak"
  | "slowWalk"
  | "gentleStretching"
  | "energyToday"
  | "fatigueToday"
  | "discomfortNote";

export type WellnessRoutineStepDefinition = {
  id: WellnessRoutineStepId;
  sectionId: WellnessRoutineSectionId;
  titleKey: TranslationKey;
};

export type WellnessRoutineSection = {
  id: WellnessRoutineSectionId;
  titleKey: TranslationKey;
  stepIds: readonly WellnessRoutineStepId[];
};

export type WellnessRoutineTemplate = {
  id: WellnessBadmintonRoutineTemplateId;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  durationKey: TranslationKey;
  stepKeys: readonly TranslationKey[];
  iconName: "trees";
  featured: boolean;
};

export type WellnessRoutineDailyState = {
  date: string;
  checkedStepIds: WellnessRoutineStepId[];
  energy: WellnessRoutineEnergyLevel | null;
  fatigue: WellnessRoutineFatigueLevel | null;
};

export type WellnessRoutineStorage = Pick<
  Storage,
  "getItem" | "setItem"
>;

const WELLNESS_ROUTINE_STEP_DEFINITIONS = [
  {
    id: "gentleShoulderMovement",
    sectionId: "beforePlay",
    titleKey: "wellness.gentleShoulderMovement",
  },
  {
    id: "gentleWristMovement",
    sectionId: "beforePlay",
    titleKey: "wellness.gentleWristMovement",
  },
  {
    id: "gentleAnkleMovement",
    sectionId: "beforePlay",
    titleKey: "wellness.gentleAnkleMovement",
  },
  {
    id: "lightWalking",
    sectionId: "beforePlay",
    titleKey: "wellness.lightWalking",
  },
  {
    id: "waterNearby",
    sectionId: "duringPlay",
    titleKey: "wellness.waterNearby",
  },
  {
    id: "startSlowly",
    sectionId: "duringPlay",
    titleKey: "wellness.startSlowly",
  },
  {
    id: "shortBreak",
    sectionId: "duringPlay",
    titleKey: "wellness.shortBreak",
  },
  {
    id: "slowWalk",
    sectionId: "afterPlay",
    titleKey: "wellness.slowWalk",
  },
  {
    id: "gentleStretching",
    sectionId: "afterPlay",
    titleKey: "wellness.gentleStretching",
  },
  {
    id: "energyToday",
    sectionId: "reflection",
    titleKey: "wellness.energyToday",
  },
  {
    id: "fatigueToday",
    sectionId: "reflection",
    titleKey: "wellness.fatigueToday",
  },
  {
    id: "discomfortNote",
    sectionId: "reflection",
    titleKey: "wellness.discomfortNote",
  },
] as const satisfies readonly WellnessRoutineStepDefinition[];

const WELLNESS_ROUTINE_STEP_IDS = WELLNESS_ROUTINE_STEP_DEFINITIONS.map(
  (step) => step.id
) as readonly WellnessRoutineStepId[];

const WELLNESS_ROUTINE_STEP_ID_SET = new Set<string>(WELLNESS_ROUTINE_STEP_IDS);
const WELLNESS_ROUTINE_STEP_KEY_BY_ID = new Map(
  WELLNESS_ROUTINE_STEP_DEFINITIONS.map((step) => [step.id, step.titleKey])
);

export const WELLNESS_BADMINTON_ROUTINE_SECTIONS = [
  {
    id: "beforePlay",
    titleKey: "wellness.beforePlay",
    stepIds: [
      "gentleShoulderMovement",
      "gentleWristMovement",
      "gentleAnkleMovement",
      "lightWalking",
    ],
  },
  {
    id: "duringPlay",
    titleKey: "wellness.duringPlay",
    stepIds: ["waterNearby", "startSlowly", "shortBreak"],
  },
  {
    id: "afterPlay",
    titleKey: "wellness.afterPlay",
    stepIds: ["slowWalk", "gentleStretching"],
  },
  {
    id: "reflection",
    titleKey: "wellness.reflection",
    stepIds: ["energyToday", "fatigueToday", "discomfortNote"],
  },
] as const satisfies readonly WellnessRoutineSection[];

export const WELLNESS_BADMINTON_ROUTINE_TEMPLATE = {
  id: WELLNESS_BADMINTON_ROUTINE_TEMPLATE_ID,
  titleKey: "wellness.badmintonRoutineTitle",
  descriptionKey: "wellness.badmintonRoutineDescription",
  durationKey: "wellness.flexiblePace",
  stepKeys: WELLNESS_ROUTINE_STEP_DEFINITIONS.map((step) => step.titleKey),
  iconName: "trees",
  featured: true,
} as const satisfies WellnessRoutineTemplate;

export function isWellnessRoutineEnabled(value: boolean): boolean {
  return value;
}

export function getWellnessRoutineStepLabelKey(stepId: WellnessRoutineStepId) {
  return WELLNESS_ROUTINE_STEP_KEY_BY_ID.get(stepId);
}

export function getWellnessRoutineStepIds() {
  return [...WELLNESS_ROUTINE_STEP_IDS];
}

export function getWellnessRoutineSectionById(sectionId: WellnessRoutineSectionId) {
  return WELLNESS_BADMINTON_ROUTINE_SECTIONS.find(
    (section) => section.id === sectionId
  );
}

export function createDefaultWellnessRoutineDailyState(
  date: string
): WellnessRoutineDailyState {
  return {
    date,
    checkedStepIds: [],
    energy: null,
    fatigue: null,
  };
}

function isWellnessRoutineStepId(value: string): value is WellnessRoutineStepId {
  return WELLNESS_ROUTINE_STEP_ID_SET.has(value);
}

export function normalizeWellnessRoutineCheckedStepIds(
  stepIds: ReadonlyArray<string>
): WellnessRoutineStepId[] {
  const selected = new Set(stepIds.filter(isWellnessRoutineStepId));
  return WELLNESS_ROUTINE_STEP_IDS.filter((stepId) => selected.has(stepId));
}

export function toggleWellnessRoutineStepId(
  currentStepIds: ReadonlyArray<string>,
  stepId: string
): WellnessRoutineStepId[] {
  if (!isWellnessRoutineStepId(stepId)) {
    return normalizeWellnessRoutineCheckedStepIds(currentStepIds);
  }

  const nextIds = new Set(normalizeWellnessRoutineCheckedStepIds(currentStepIds));

  if (nextIds.has(stepId)) {
    nextIds.delete(stepId);
  } else {
    nextIds.add(stepId);
  }

  return WELLNESS_ROUTINE_STEP_IDS.filter((currentStepId) =>
    nextIds.has(currentStepId)
  );
}

export function parseWellnessRoutineCheckedStepIds(
  value: string | null | undefined
): WellnessRoutineStepId[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeWellnessRoutineCheckedStepIds(
      parsed.filter((item): item is string => typeof item === "string")
    );
  } catch {
    return [];
  }
}

export function parseWellnessRoutineEnergyLevel(
  value: string | null | undefined
): WellnessRoutineEnergyLevel | null {
  if (value === "low" || value === "okay" || value === "good") {
    return value;
  }

  return null;
}

export function parseWellnessRoutineFatigueLevel(
  value: string | null | undefined
): WellnessRoutineFatigueLevel | null {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return null;
}

export function getWellnessRoutineDailyState({
  currentDate,
  storedDate,
  storedCheckedStepIds,
  storedEnergy,
  storedFatigue,
}: {
  currentDate: string;
  storedDate: string | null | undefined;
  storedCheckedStepIds: string | null | undefined;
  storedEnergy: string | null | undefined;
  storedFatigue: string | null | undefined;
}): WellnessRoutineDailyState {
  if (storedDate !== currentDate) {
    return createDefaultWellnessRoutineDailyState(currentDate);
  }

  return {
    date: currentDate,
    checkedStepIds: parseWellnessRoutineCheckedStepIds(storedCheckedStepIds),
    energy: parseWellnessRoutineEnergyLevel(storedEnergy),
    fatigue: parseWellnessRoutineFatigueLevel(storedFatigue),
  };
}

export function saveWellnessRoutineDailyState(
  storage: WellnessRoutineStorage | null | undefined,
  state: WellnessRoutineDailyState
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY, state.date);
    storage.setItem(
      WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
      JSON.stringify(normalizeWellnessRoutineCheckedStepIds(state.checkedStepIds))
    );
    storage.setItem(
      WELLNESS_BADMINTON_ROUTINE_ENERGY_STORAGE_KEY,
      state.energy ?? ""
    );
    storage.setItem(
      WELLNESS_BADMINTON_ROUTINE_FATIGUE_STORAGE_KEY,
      state.fatigue ?? ""
    );

    return true;
  } catch {
    return false;
  }
}
