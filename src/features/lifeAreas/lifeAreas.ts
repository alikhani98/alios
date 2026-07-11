import { addDays, endOfDay, isValid, parseISO } from "date-fns";

import type { TranslationKey } from "@/shared/i18n";
import type {
  LifeArea,
  LifeAreaAttentionLevel,
  LifeAreaKey,
  LifeAreaStatus,
} from "@/shared/types";

import {
  LIFE_AREA_ATTENTION_LABEL_KEYS,
  LIFE_AREA_DEFINITIONS,
} from "./constants";

export type LifeAreaFilter = {
  status: LifeAreaStatus | "all";
  attentionLevel: LifeAreaAttentionLevel | "all";
  query: string;
};

export type LifeAreaView = Omit<LifeArea, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
  isPersisted?: boolean;
  isCanonical?: boolean;
};

export type LifeAreaSummary = {
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  archivedCount: number;
  highAttentionActiveCount: number;
  reviewDueCount: number;
  averageSatisfactionScore: number | null;
  latestReviewedArea?: LifeAreaView;
};

function parseDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function normalizeQuery(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function getLifeAreaDefinitions(
  t: (key: TranslationKey) => string
) {
  return LIFE_AREA_DEFINITIONS.map((definition) => ({
    ...definition,
    title: t(definition.titleKey),
    description: t(definition.descriptionKey),
  }));
}

export function mergeLifeAreas(
  persistedAreas: ReadonlyArray<LifeArea>,
  t: (key: TranslationKey) => string
): LifeAreaView[] {
  const byAreaKey = new Map(
    persistedAreas.map((area) => [area.areaKey, area] as const)
  );

  return LIFE_AREA_DEFINITIONS.map((definition) => {
    const persisted = byAreaKey.get(definition.areaKey);
    const base = {
      id: definition.areaKey,
      areaKey: definition.areaKey,
      title: t(definition.titleKey),
      description: t(definition.descriptionKey),
      status: "active" as const,
      attentionLevel: definition.defaultAttentionLevel,
      satisfactionScore: undefined,
      focusNote: "",
      reviewIntervalDays: undefined,
      lastReviewedAt: undefined,
      tags: [] as string[],
      createdAt: undefined,
      updatedAt: undefined,
      isPersisted: false,
      isCanonical: true,
    };

    if (!persisted) {
      return base;
    }

    return {
      ...base,
      ...persisted,
      title: persisted.title.trim().length > 0 ? persisted.title : base.title,
      description:
        persisted.description.trim().length > 0
          ? persisted.description
          : base.description,
      focusNote: persisted.focusNote?.trim() ?? "",
      tags: [...persisted.tags],
      isPersisted: true,
      isCanonical: false,
    };
  });
}

export function getActiveLifeAreas(
  areas: ReadonlyArray<LifeAreaView>
): LifeAreaView[] {
  return areas.filter((area) => area.status === "active");
}

export function getPausedLifeAreas(
  areas: ReadonlyArray<LifeAreaView>
): LifeAreaView[] {
  return areas.filter((area) => area.status === "paused");
}

export function getArchivedLifeAreas(
  areas: ReadonlyArray<LifeAreaView>
): LifeAreaView[] {
  return areas.filter((area) => area.status === "archived");
}

export function isLifeAreaReviewDue(
  area: Pick<
    LifeAreaView,
    "status" | "reviewIntervalDays" | "lastReviewedAt" | "updatedAt"
  >,
  referenceDate = new Date()
): boolean {
  if (
    area.status !== "active" ||
    !area.reviewIntervalDays ||
    area.reviewIntervalDays <= 0
  ) {
    return false;
  }

  const reviewBase = area.lastReviewedAt ?? area.updatedAt;
  if (!reviewBase) {
    return false;
  }

  const parsedBase = parseDate(reviewBase);
  if (parsedBase === null) {
    return false;
  }

  const dueDate = addDays(parsedBase, area.reviewIntervalDays);
  return dueDate.getTime() <= endOfDay(referenceDate).getTime();
}

export function getReviewDueLifeAreas(
  areas: ReadonlyArray<LifeAreaView>,
  referenceDate = new Date()
): LifeAreaView[] {
  return areas
    .filter((area) => isLifeAreaReviewDue(area, referenceDate))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export function getHighAttentionLifeAreas(
  areas: ReadonlyArray<LifeAreaView>
): LifeAreaView[] {
  return areas.filter(
    (area) =>
      area.status === "active" &&
      area.attentionLevel === "high"
  );
}

export function getAverageLifeAreaSatisfactionScore(
  areas: ReadonlyArray<LifeAreaView>
): number | null {
  const scores = areas
    .map((area) => area.satisfactionScore)
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) {
    return null;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function filterLifeAreas(
  areas: ReadonlyArray<LifeAreaView>,
  filter: LifeAreaFilter
): LifeAreaView[] {
  const query = normalizeQuery(filter.query);

  return [...areas]
    .sort((a, b) => a.areaKey.localeCompare(b.areaKey))
    .filter((area) => {
      const matchesStatus =
        filter.status === "all" || area.status === filter.status;
      const matchesAttention =
        filter.attentionLevel === "all" ||
        area.attentionLevel === filter.attentionLevel;
      const searchable = compact(
        [
          area.title,
          area.description,
          area.focusNote,
          area.tags.join(" "),
          area.areaKey,
          area.status,
          area.attentionLevel,
          area.satisfactionScore ? String(area.satisfactionScore) : "",
        ].join(" ")
      ).toLowerCase();
      const matchesQuery = query.length === 0 || searchable.includes(query);

      return matchesStatus && matchesAttention && matchesQuery;
    });
}

export function getLifeAreasSummary(
  areas: ReadonlyArray<LifeAreaView>,
  referenceDate = new Date()
): LifeAreaSummary {
  const activeAreas = getActiveLifeAreas(areas);
  const reviewDueAreas = getReviewDueLifeAreas(areas, referenceDate);
  const reviewedAreas = areas.filter((area) => area.lastReviewedAt);

  return {
    totalCount: areas.length,
    activeCount: activeAreas.length,
    pausedCount: getPausedLifeAreas(areas).length,
    archivedCount: getArchivedLifeAreas(areas).length,
    highAttentionActiveCount: getHighAttentionLifeAreas(areas).length,
    reviewDueCount: reviewDueAreas.length,
    averageSatisfactionScore: getAverageLifeAreaSatisfactionScore(areas),
    latestReviewedArea:
      reviewedAreas.length === 0
        ? undefined
        : [...reviewedAreas].sort((a, b) =>
            (b.lastReviewedAt ?? b.updatedAt ?? "").localeCompare(
              a.lastReviewedAt ?? a.updatedAt ?? ""
            )
          )[0],
  };
}

export function getLifeAreaAttentionTone(
  attentionLevel: LifeAreaAttentionLevel
): "neutral" | "warning" | "success" {
  switch (attentionLevel) {
    case "high":
      return "warning";
    case "low":
      return "success";
    case "medium":
    default:
      return "neutral";
  }
}

export { LIFE_AREA_ATTENTION_LABEL_KEYS, LIFE_AREA_DEFINITIONS };
