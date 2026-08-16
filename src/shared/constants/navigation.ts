import type { TranslationKey } from "@/shared/i18n";
import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";

export type NavIconName =
  | "home"
  | "search"
  | "calendar-check"
  | "calendar-range"
  | "timer"
  | "repeat"
  | "git-branch"
  | "inbox"
  | "folder-kanban"
  | "target"
  | "compass"
  | "book-open"
  | "notebook-text"
  | "wallet"
  | "database"
  | "settings";

export type NavItem = {
  titleKey: TranslationKey;
  href: string;
  icon: NavIconName;
};

export const navigationGroupIds = [
  "direct",
  "advanced",
] as const;

export type NavigationGroupId = (typeof navigationGroupIds)[number];

export type NavigationGroup = {
  id: NavigationGroupId;
  titleKey?: TranslationKey;
  items: NavItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    id: "direct",
    items: [
      {
        titleKey: "nav.home",
        href: "/",
        icon: "home",
      },
      {
        titleKey: "nav.today",
        href: "/today",
        icon: "calendar-check",
      },
      {
        titleKey: "nav.inbox",
        href: "/inbox",
        icon: "inbox",
      },
      {
        titleKey: "nav.projects",
        href: "/projects",
        icon: "folder-kanban",
      },
      {
        titleKey: "nav.calendar",
        href: "/calendar",
        icon: "calendar-range",
      },
      {
        titleKey: "nav.focus",
        href: "/focus",
        icon: "timer",
      },
      {
        titleKey: "nav.search",
        href: "/search",
        icon: "search",
      },
    ],
  },
  {
    id: "advanced",
    titleKey: "nav.groupAdvanced",
    items: [
      {
        titleKey: "nav.routines",
        href: "/routines",
        icon: "repeat",
      },
      {
        titleKey: "nav.weeklyReview",
        href: "/weekly-review",
        icon: "calendar-range",
      },
      {
        titleKey: "nav.decisions",
        href: "/decisions",
        icon: "git-branch",
      },
      {
        titleKey: "nav.goals",
        href: "/goals",
        icon: "target",
      },
      {
        titleKey: "nav.lifeAreas",
        href: "/life-areas",
        icon: "compass",
      },
      {
        titleKey: "nav.journal",
        href: "/journal",
        icon: "book-open",
      },
      {
        titleKey: "nav.knowledge",
        href: "/knowledge",
        icon: "database",
      },
      {
        titleKey: "nav.manual",
        href: "/manual",
        icon: "notebook-text",
      },
      {
        titleKey: "nav.finance",
        href: "/finance",
        icon: "wallet",
      },
      {
        titleKey: "nav.settings",
        href: "/settings",
        icon: "settings",
      },
    ],
  },
];

export const mainNavigation: NavItem[] = navigationGroups.flatMap(
  (group) => group.items
);

export const defaultOpenNavigationGroupIds: NavigationGroupId[] = [];

export const NAVIGATION_GROUPS_STORAGE_KEY = "alios.navigation.openGroups";

export function isNavigationGroupId(
  value: unknown
): value is NavigationGroupId {
  return (
    typeof value === "string" &&
    navigationGroupIds.includes(value as NavigationGroupId)
  );
}

export function normalizeNavigationGroupIds(
  value: unknown
): NavigationGroupId[] {
  if (typeof value === "string") {
    try {
      return normalizeNavigationGroupIds(JSON.parse(value));
    } catch {
      return [...defaultOpenNavigationGroupIds];
    }
  }

  if (!Array.isArray(value)) {
    return [...defaultOpenNavigationGroupIds];
  }

  const result: NavigationGroupId[] = [];

  for (const entry of value) {
    if (
      isNavigationGroupId(entry) &&
      entry !== "direct" &&
      !result.includes(entry)
    ) {
      result.push(entry);
    }
  }

  return result;
}

export function readStoredOpenNavigationGroupIds(): NavigationGroupId[] {
  return readStoredPreference(
    NAVIGATION_GROUPS_STORAGE_KEY,
    normalizeNavigationGroupIds,
    [...defaultOpenNavigationGroupIds]
  );
}

export function writeStoredOpenNavigationGroupIds(
  value: readonly NavigationGroupId[]
) {
  writeStoredPreference(
    NAVIGATION_GROUPS_STORAGE_KEY,
    JSON.stringify(normalizeNavigationGroupIds([...value]))
  );
}

export function getNavigationItemByPath(pathname: string) {
  return (
    mainNavigation.find((item) => item.href === pathname) ?? mainNavigation[0]
  );
}
