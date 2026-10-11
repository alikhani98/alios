import type { TranslationKey } from "@/shared/i18n";
import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";

export type NavIconName =
  | "home"
  | "brain"
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
  | "flask-conical"
  | "shuffle"
  | "activity"
  | "wallet"
  | "database"
  | "settings";

export type NavItem = {
  titleKey: TranslationKey;
  href: string;
  icon: NavIconName;
};

export const navigationGroupIds = [
  "executive",
  "planning",
  "reflection",
  "system",
] as const;

export type NavigationGroupId = (typeof navigationGroupIds)[number];

export type NavigationGroup = {
  id: NavigationGroupId;
  titleKey?: TranslationKey;
  collapsible?: boolean;
  items: NavItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    id: "executive",
    titleKey: "nav.groupExecutive",
    collapsible: false,
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
        titleKey: "nav.focus",
        href: "/focus",
        icon: "timer",
      },
    ],
  },
  {
    id: "planning",
    titleKey: "nav.groupPlanning",
    collapsible: true,
    items: [
      {
        titleKey: "nav.projects",
        href: "/projects",
        icon: "folder-kanban",
      },
      {
        titleKey: "nav.goals",
        href: "/goals",
        icon: "target",
      },
      {
        titleKey: "nav.calendar",
        href: "/calendar",
        icon: "calendar-range",
      },
      {
        titleKey: "nav.routines",
        href: "/routines",
        icon: "repeat",
      },
      {
        titleKey: "nav.ifthen",
        href: "/ifthen",
        icon: "shuffle",
      },
      {
        titleKey: "nav.decisions",
        href: "/decisions",
        icon: "git-branch",
      },
      {
        titleKey: "nav.finance",
        href: "/finance",
        icon: "wallet",
      },
    ],
  },
  {
    id: "reflection",
    titleKey: "nav.groupReflection",
    collapsible: true,
    items: [
      {
        titleKey: "nav.weeklyReview",
        href: "/weekly-review",
        icon: "calendar-range",
      },
      {
        titleKey: "nav.journal",
        href: "/journal",
        icon: "book-open",
      },
      {
        titleKey: "nav.lifeAreas",
        href: "/life-areas",
        icon: "compass",
      },
      {
        titleKey: "nav.patterns",
        href: "/patterns",
        icon: "activity",
      },
      {
        titleKey: "nav.experiments",
        href: "/experiments",
        icon: "flask-conical",
      },
      {
        titleKey: "nav.therapy",
        href: "/therapy",
        icon: "brain",
      },
    ],
  },
  {
    id: "system",
    titleKey: "nav.groupSystem",
    collapsible: true,
    items: [
      {
        titleKey: "nav.knowledge",
        href: "/knowledge",
        icon: "database",
      },
      {
        titleKey: "nav.resources",
        href: "/resources",
        icon: "book-open",
      },
      {
        titleKey: "nav.manual",
        href: "/manual",
        icon: "notebook-text",
      },
      {
        titleKey: "nav.settings",
        href: "/settings",
        icon: "settings",
      },
      {
        titleKey: "nav.search",
        href: "/search",
        icon: "search",
      },
    ],
  },
];

export const mainNavigation: NavItem[] = navigationGroups.flatMap(
  (group) => group.items
);

export const defaultOpenNavigationGroupIds: NavigationGroupId[] = ["planning"];

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
      navigationGroups.some(
        (group) => group.id === entry && group.collapsible !== false
      ) &&
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
