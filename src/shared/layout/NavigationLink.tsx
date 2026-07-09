import { NavLink } from "react-router-dom";

import type { NavItem } from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/utils";
import { aliosFocusRing, aliosInteractiveLift, aliosInteractiveMotion } from "@/shared/ui/motion";

import { navigationIcons } from "./navigation-icons";

type NavigationLinkProps = {
  item: NavItem;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function NavigationLink({
  item,
  collapsed = false,
  onNavigate,
}: NavigationLinkProps) {
  const { t } = useI18n();
  const Icon = navigationIcons[item.icon];
  const title = t(item.titleKey);

  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
          aliosFocusRing,
          aliosInteractiveMotion,
          aliosInteractiveLift,
          isActive
            ? "border border-primary/15 bg-primary text-primary-foreground shadow-lg shadow-primary/10"
            : "border border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )
      }
      title={collapsed ? title : undefined}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent bg-background/65 text-muted-foreground shadow-sm transition-colors duration-200 ease-out motion-reduce:transition-none",
              isActive && "bg-primary/15 text-primary",
              !isActive && "group-hover:bg-background group-hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          {!collapsed ? <span className="truncate">{title}</span> : null}
        </>
      )}
    </NavLink>
  );
}
