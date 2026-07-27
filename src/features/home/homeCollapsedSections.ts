import {
  getPreferenceStorage,
  writeStoredPreference,
} from "@/shared/preferences/storage";

export const HOME_COLLAPSED_SECTIONS_STORAGE_KEY =
  "alios.home.collapsedSections";

export const homeCollapsibleSectionIds = [
  "emptyState",
  "routineNudge",
  "wellnessBadminton",
  "routineTemplates",
  "upcomingTasks",
  "calendar",
  "summaryStats",
  "personalInsights",
  "projectsOverview",
  "journalOverview",
  "knowledgeOverview",
  "manualOverview",
  "quickActions",
] as const;

export type HomeCollapsibleSectionId =
  (typeof homeCollapsibleSectionIds)[number];

function isHomeCollapsibleSectionId(
  value: unknown
): value is HomeCollapsibleSectionId {
  return (
    typeof value === "string" &&
    homeCollapsibleSectionIds.includes(value as HomeCollapsibleSectionId)
  );
}

export function normalizeHomeCollapsedSectionIds(
  value: unknown
): HomeCollapsibleSectionId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: HomeCollapsibleSectionId[] = [];

  for (const entry of value) {
    if (isHomeCollapsibleSectionId(entry) && !result.includes(entry)) {
      result.push(entry);
    }
  }

  return result;
}

export function readStoredHomeCollapsedSectionIds():
  | HomeCollapsibleSectionId[]
  | null {
  const storage = getPreferenceStorage();

  if (!storage) {
    return null;
  }

  try {
    const stored = storage.getItem(
      HOME_COLLAPSED_SECTIONS_STORAGE_KEY
    );

    if (stored === null) {
      return null;
    }

    return normalizeHomeCollapsedSectionIds(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function writeStoredHomeCollapsedSectionIds(
  value: readonly HomeCollapsibleSectionId[]
) {
  try {
    writeStoredPreference(
      HOME_COLLAPSED_SECTIONS_STORAGE_KEY,
      JSON.stringify(Array.from(new Set(value)))
    );
  } catch {
    // Keep the section state in memory if storage is unavailable.
  }
}

