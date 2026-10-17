import { NavLink } from "react-router-dom";

import type { NavItem } from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import {
  aliosFocusRing,
  aliosInteractiveMotion,
} from "@/shared/ui/motion";

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
          "alios-workspace-nav-link group flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
          aliosFocusRing,
          aliosInteractiveMotion,
          isActive
            ? "border border-primary/15 bg-primary/10 font-semibold text-foreground"
            : "border border-transparent bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground",
          collapsed && "justify-center px-2"
        )
      }
      title={collapsed ? title : undefined}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 motion-reduce:transition-none",
              isActive && "text-primary",
              !isActive &&
                "group-hover:text-foreground"
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
