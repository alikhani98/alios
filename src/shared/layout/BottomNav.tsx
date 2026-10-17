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
  conflictCount?: number;
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

export function BottomNav({
  onOpenMenu,
  menuOpen = false,
  conflictCount = 0,
}: BottomNavProps) {
  const { t } = useI18n();
  const hasSyncConflicts = conflictCount > 0;
  const menuAriaLabel = hasSyncConflicts
    ? `${t("shell.openMenu")} - ${t("settings.syncStatusConflict")}`
    : t("shell.openMenu");

  return (
    <nav
      className="alios-workspace-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border/70 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden"
      aria-label={t("nav.mobile")}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
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
                  "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium leading-4 active:bg-accent",
                  aliosFocusRing,
                  aliosInteractiveMotion,
                  isActive
                    ? "bg-primary/10 font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute top-0 h-0.5 w-5 rounded-full transition-colors duration-150 motion-reduce:transition-none",
                      isActive ? "bg-primary" : "bg-transparent"
                    )}
                    aria-hidden="true"
                  />
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="max-w-full break-words text-center">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          className={cn(
            "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium leading-4 active:bg-accent",
            aliosFocusRing,
            aliosInteractiveMotion,
            menuOpen
              ? "bg-primary/10 font-semibold text-foreground"
              : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
          )}
          aria-label={menuAriaLabel}
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <span
            className={cn(
              "absolute top-0 h-0.5 w-5 rounded-full transition-colors duration-150 motion-reduce:transition-none",
              menuOpen ? "bg-primary" : "bg-transparent"
            )}
            aria-hidden="true"
          />
          {hasSyncConflicts ? (
            <span
              className="absolute end-1 top-1 h-2 w-2 rounded-full bg-[#B23A48]"
              aria-hidden="true"
            />
          ) : null}
          <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="max-w-full break-words text-center">{t("nav.menu")}</span>
        </button>
      </div>
    </nav>
  );
}
