export type NavIconName =
  | "home"
  | "search"
  | "calendar-check"
  | "calendar-range"
  | "inbox"
  | "folder-kanban"
  | "book-open"
  | "wallet"
  | "database"
  | "settings";

export type NavItem = {
  titleKey: TranslationKey;
  href: string;
  icon: NavIconName;
};

export const mainNavigation: NavItem[] = [
  {
    titleKey: "nav.home",
    href: "/",
    icon: "home",
  },
  {
    titleKey: "nav.search",
    href: "/search",
    icon: "search",
  },
  {
    titleKey: "nav.today",
    href: "/today",
    icon: "calendar-check",
  },
  {
    titleKey: "nav.weeklyReview",
    href: "/weekly-review",
    icon: "calendar-range",
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
    titleKey: "nav.finance",
    href: "/finance",
    icon: "wallet",
  },
  {
    titleKey: "nav.settings",
    href: "/settings",
    icon: "settings",
  },
];

export function getNavigationItemByPath(pathname: string) {
  return (
    mainNavigation.find((item) => item.href === pathname) ?? mainNavigation[0]
  );
}
import type { TranslationKey } from "@/shared/i18n";
