import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

import type { NavItem } from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { aliosFocusRing, aliosInteractiveMotion } from "@/shared/ui/motion";

import { navigationIcons } from "./navigation-icons";

type BottomNavProps = {
  onOpenMenu: () => void;
  menuOpen?: boolean;
};

const primaryTabs: NavItem[] = [
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
    titleKey: "nav.calendar",
    href: "/calendar",
    icon: "calendar-range",
  },
];

export function BottomNav({ onOpenMenu, menuOpen = false }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_45px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/82 md:hidden"
      aria-label={t("nav.mobile")}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.4rem] border border-border/70 bg-card/85 p-1 shadow-sm">
        {primaryTabs.map((item) => {
          const Icon = navigationIcons[item.icon];
          const label = t(item.titleKey);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[0.7rem] font-medium leading-none",
                  aliosFocusRing,
                  aliosInteractiveMotion,
                  isActive
                    ? "text-alios-caspian dark:text-alios-paper"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute top-1 h-1 w-6 rounded-full transition-colors duration-150",
                      isActive ? "bg-alios-caspian dark:bg-alios-paper" : "bg-transparent"
                    )}
                    aria-hidden="true"
                  />
                  <Icon className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="max-w-full truncate">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          className={cn(
            "relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[0.7rem] font-medium leading-none",
            aliosFocusRing,
            aliosInteractiveMotion,
            menuOpen
              ? "text-alios-caspian dark:text-alios-paper"
              : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
          )}
          aria-label={t("shell.openMenu")}
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <span
            className={cn(
              "absolute top-1 h-1 w-6 rounded-full transition-colors duration-150",
              menuOpen ? "bg-alios-caspian dark:bg-alios-paper" : "bg-transparent"
            )}
            aria-hidden="true"
          />
          <Menu className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="max-w-full truncate">{t("nav.menu")}</span>
        </button>
      </div>
    </nav>
  );
}
