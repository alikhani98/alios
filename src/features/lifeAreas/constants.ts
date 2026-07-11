import type { TranslationKey } from "@/shared/i18n";
import type {
  LifeAreaAttentionLevel,
  LifeAreaKey,
  LifeAreaStatus,
} from "@/shared/types";

export const LIFE_AREA_DEFINITIONS: ReadonlyArray<{
  areaKey: LifeAreaKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  defaultAttentionLevel: LifeAreaAttentionLevel;
}> = [
  {
    areaKey: "health",
    titleKey: "lifeAreas.healthTitle",
    descriptionKey: "lifeAreas.healthDescription",
    defaultAttentionLevel: "high",
  },
  {
    areaKey: "work",
    titleKey: "lifeAreas.workTitle",
    descriptionKey: "lifeAreas.workDescription",
    defaultAttentionLevel: "high",
  },
  {
    areaKey: "learning",
    titleKey: "lifeAreas.learningTitle",
    descriptionKey: "lifeAreas.learningDescription",
    defaultAttentionLevel: "medium",
  },
  {
    areaKey: "finance",
    titleKey: "lifeAreas.financeTitle",
    descriptionKey: "lifeAreas.financeDescription",
    defaultAttentionLevel: "medium",
  },
  {
    areaKey: "relationships",
    titleKey: "lifeAreas.relationshipsTitle",
    descriptionKey: "lifeAreas.relationshipsDescription",
    defaultAttentionLevel: "medium",
  },
  {
    areaKey: "personal",
    titleKey: "lifeAreas.personalTitle",
    descriptionKey: "lifeAreas.personalDescription",
    defaultAttentionLevel: "medium",
  },
  {
    areaKey: "other",
    titleKey: "lifeAreas.otherTitle",
    descriptionKey: "lifeAreas.otherDescription",
    defaultAttentionLevel: "low",
  },
] as const;

export const LIFE_AREA_STATUS_OPTIONS: ReadonlyArray<{
  value: LifeAreaStatus | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "lifeAreas.allStatuses" },
  { value: "active", labelKey: "lifeAreas.statusActive" },
  { value: "paused", labelKey: "lifeAreas.statusPaused" },
  { value: "archived", labelKey: "lifeAreas.statusArchived" },
];

export const LIFE_AREA_ATTENTION_OPTIONS: ReadonlyArray<{
  value: LifeAreaAttentionLevel | "all";
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "lifeAreas.allAttention" },
  { value: "low", labelKey: "common.low" },
  { value: "medium", labelKey: "common.medium" },
  { value: "high", labelKey: "common.high" },
];

export const LIFE_AREA_STATUS_LABEL_KEYS: Record<
  LifeAreaStatus,
  TranslationKey
> = {
  active: "lifeAreas.statusActive",
  paused: "lifeAreas.statusPaused",
  archived: "lifeAreas.statusArchived",
};

export const LIFE_AREA_ATTENTION_LABEL_KEYS: Record<
  LifeAreaAttentionLevel,
  TranslationKey
> = {
  low: "common.low",
  medium: "common.medium",
  high: "common.high",
};
