import type { TranslationKey } from "@/shared/i18n";

export const HOME_DASHBOARD_LAYOUT_STORAGE_KEY =
  "alios.home.dashboardLayout";

export const homeDashboardSections = [
  { id: "quickAccess", titleKey: "quickAccess.title" },
  { id: "clearStart", titleKey: "home.clearStartTitle" },
  { id: "summaryStats", titleKey: "home.sectionSummaryStats" },
  { id: "todayTasks", titleKey: "home.sectionTodayTasks" },
  { id: "reminders", titleKey: "home.sectionReminders" },
  { id: "tomorrow", titleKey: "home.sectionTomorrow" },
  { id: "learning", titleKey: "home.learningKnowledgeTitle" },
  { id: "moreSections", titleKey: "home.moreDashboard" },
  { id: "eveningBriefing", titleKey: "home.sectionEveningBriefing" },
  { id: "welcome", titleKey: "home.sectionWelcome" },
  { id: "backupReminder", titleKey: "home.backupReminderTitle" },
] as const satisfies ReadonlyArray<{ id: string; titleKey: TranslationKey }>;

export const homeDashboardSectionIds = homeDashboardSections.map(
  ({ id }) => id
);

export type HomeDashboardSectionId =
  (typeof homeDashboardSections)[number]["id"];

export type HomeDashboardLayout = {
  orderedSectionIds: HomeDashboardSectionId[];
  hiddenSectionIds: HomeDashboardSectionId[];
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
  const isHidden = layout.hiddenSectionIds.includes(sectionId);
  const group = layout.orderedSectionIds.filter(
    (id) => layout.hiddenSectionIds.includes(id) === isHidden
  );
  const currentIndex = group.indexOf(sectionId);
  const targetId = group[currentIndex + direction];
  if (currentIndex < 0 || !targetId) {
    return layout;
  }
  return moveDashboardSectionTo(
    layout,
    sectionId,
    targetId,
    direction === -1 ? "before" : "after"
  );
}

export function moveDashboardSectionTo(
  layout: HomeDashboardLayout,
  sectionId: HomeDashboardSectionId,
  targetId: HomeDashboardSectionId,
  placement: "before" | "after"
): HomeDashboardLayout {
  const isHidden = layout.hiddenSectionIds.includes(sectionId);
  if (
    sectionId === targetId ||
    !layout.orderedSectionIds.includes(sectionId) ||
    !layout.orderedSectionIds.includes(targetId) ||
    layout.hiddenSectionIds.includes(targetId) !== isHidden
  ) {
    return layout;
  }

  const group = layout.orderedSectionIds.filter(
    (id) => layout.hiddenSectionIds.includes(id) === isHidden
  );
  const reorderedGroup = group.filter((id) => id !== sectionId);
  const targetIndex = reorderedGroup.indexOf(targetId);
  reorderedGroup.splice(
    targetIndex + (placement === "after" ? 1 : 0),
    0,
    sectionId
  );
  let groupIndex = 0;
  const orderedSectionIds = layout.orderedSectionIds.map((id) =>
    layout.hiddenSectionIds.includes(id) === isHidden
      ? reorderedGroup[groupIndex++]
      : id
  );

  return orderedSectionIds.every((id, index) => id === layout.orderedSectionIds[index])
    ? layout
    : { ...layout, orderedSectionIds };
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
