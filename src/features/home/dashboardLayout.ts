import type { TranslationKey } from "@/shared/i18n";

export const HOME_DASHBOARD_LAYOUT_STORAGE_KEY =
  "alios.home.dashboardLayout";

export const homeDashboardSectionIds = [
  "hero",
  "emptyState",
  "routineNudge",
  "wellnessBadminton",
  "routineTemplates",
  "upcomingTasks",
  "calendar",
  "summaryStats",
  "projectsOverview",
  "journalOverview",
  "knowledgeOverview",
  "quickActions",
] as const;

export type HomeDashboardSectionId =
  (typeof homeDashboardSectionIds)[number];

export type HomeDashboardLayout = {
  orderedSectionIds: HomeDashboardSectionId[];
  hiddenSectionIds: HomeDashboardSectionId[];
};

export type HomeDashboardSectionMeta = {
  titleKey: TranslationKey;
};

export const homeDashboardSectionMeta: Record<
  HomeDashboardSectionId,
  HomeDashboardSectionMeta
> = {
  hero: { titleKey: "home.sectionHero" },
  emptyState: { titleKey: "home.sectionEmptyState" },
  routineNudge: { titleKey: "home.sectionRoutineNudge" },
  wellnessBadminton: { titleKey: "home.sectionWellnessBadminton" },
  routineTemplates: { titleKey: "home.sectionRoutineTemplates" },
  upcomingTasks: { titleKey: "home.sectionUpcomingTasks" },
  calendar: { titleKey: "home.sectionCalendar" },
  summaryStats: { titleKey: "home.sectionSummaryStats" },
  projectsOverview: { titleKey: "home.sectionProjectsOverview" },
  journalOverview: { titleKey: "home.sectionJournalOverview" },
  knowledgeOverview: { titleKey: "home.sectionKnowledgeOverview" },
  quickActions: { titleKey: "home.sectionQuickActions" },
};

function isHomeDashboardSectionId(value: unknown): value is HomeDashboardSectionId {
  return typeof value === "string" && homeDashboardSectionIds.includes(value as HomeDashboardSectionId);
}

function uniqueSectionIds(
  sectionIds: readonly unknown[]
): HomeDashboardSectionId[] {
  const seen = new Set<HomeDashboardSectionId>();
  const unique: HomeDashboardSectionId[] = [];

  sectionIds.forEach((sectionId) => {
    if (isHomeDashboardSectionId(sectionId) && !seen.has(sectionId)) {
      seen.add(sectionId);
      unique.push(sectionId);
    }
  });

  return unique;
}

export function getDefaultDashboardLayout(
  availableSectionIds: readonly HomeDashboardSectionId[] = homeDashboardSectionIds
): HomeDashboardLayout {
  return {
    orderedSectionIds: [...availableSectionIds],
    hiddenSectionIds: [],
  };
}

export function normalizeDashboardLayout(
  value: unknown,
  availableSectionIds: readonly HomeDashboardSectionId[] = homeDashboardSectionIds
): HomeDashboardLayout {
  const defaultLayout = getDefaultDashboardLayout(availableSectionIds);

  if (!value || typeof value !== "object") {
    return defaultLayout;
  }

  const candidate = value as Partial<Record<keyof HomeDashboardLayout, unknown>>;
  const orderedSectionIds = uniqueSectionIds(
    Array.isArray(candidate.orderedSectionIds)
      ? candidate.orderedSectionIds
      : defaultLayout.orderedSectionIds
  );
  const hiddenSectionIds = uniqueSectionIds(
    Array.isArray(candidate.hiddenSectionIds)
      ? candidate.hiddenSectionIds
      : []
  );

  const normalizedOrder = [
    ...orderedSectionIds.filter((sectionId) =>
      availableSectionIds.includes(sectionId)
    ),
    ...availableSectionIds.filter(
      (sectionId) => !orderedSectionIds.includes(sectionId)
    ),
  ];

  return {
    orderedSectionIds: normalizedOrder,
    hiddenSectionIds: hiddenSectionIds.filter((sectionId) =>
      availableSectionIds.includes(sectionId)
    ),
  };
}

function moveSection(
  layout: HomeDashboardLayout,
  sectionId: HomeDashboardSectionId,
  direction: -1 | 1
): HomeDashboardLayout {
  const currentIndex = layout.orderedSectionIds.indexOf(sectionId);

  if (currentIndex < 0) {
    return layout;
  }

  const targetIndex = currentIndex + direction;

  if (
    targetIndex < 0 ||
    targetIndex >= layout.orderedSectionIds.length
  ) {
    return layout;
  }

  const orderedSectionIds = [...layout.orderedSectionIds];
  const [movedSectionId] = orderedSectionIds.splice(currentIndex, 1);
  orderedSectionIds.splice(targetIndex, 0, movedSectionId);

  return {
    ...layout,
    orderedSectionIds,
  };
}

export function moveDashboardSectionUp(
  layout: HomeDashboardLayout,
  sectionId: HomeDashboardSectionId
): HomeDashboardLayout {
  return moveSection(layout, sectionId, -1);
}

export function moveDashboardSectionDown(
  layout: HomeDashboardLayout,
  sectionId: HomeDashboardSectionId
): HomeDashboardLayout {
  return moveSection(layout, sectionId, 1);
}

export function toggleDashboardSectionVisibility(
  layout: HomeDashboardLayout,
  sectionId: HomeDashboardSectionId
): HomeDashboardLayout {
  const hiddenSectionIds = layout.hiddenSectionIds.includes(sectionId)
    ? layout.hiddenSectionIds.filter((hiddenId) => hiddenId !== sectionId)
    : [...layout.hiddenSectionIds, sectionId];

  return {
    ...layout,
    hiddenSectionIds,
  };
}

export function resetDashboardLayout(
  availableSectionIds: readonly HomeDashboardSectionId[] = homeDashboardSectionIds
): HomeDashboardLayout {
  return getDefaultDashboardLayout(availableSectionIds);
}

export function getVisibleDashboardSections(
  layout: HomeDashboardLayout
): HomeDashboardSectionId[] {
  return layout.orderedSectionIds.filter(
    (sectionId) => !layout.hiddenSectionIds.includes(sectionId)
  );
}
