export type NavIconName =
  | "home"
  | "calendar-check"
  | "folder-kanban"
  | "book-open"
  | "database"
  | "settings";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIconName;
  description: string;
};

export const mainNavigation: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: "home",
    description: "داشبورد اصلی AliOS",
  },
  {
    title: "Today",
    href: "/today",
    icon: "calendar-check",
    description: "برنامه و وضعیت امروز",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: "folder-kanban",
    description: "پروژه‌های فعال و آینده",
  },
  {
    title: "Journal",
    href: "/journal",
    icon: "book-open",
    description: "ثبت روزانه و بازتاب‌ها",
  },
  {
    title: "Knowledge",
    href: "/knowledge",
    icon: "database",
    description: "پایگاه دانش شخصی",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "settings",
    description: "تنظیمات و وضعیت سیستم",
  },
];

export function getNavigationItemByPath(pathname: string) {
  return (
    mainNavigation.find((item) => item.href === pathname) ?? mainNavigation[0]
  );
}
