import { NavLink } from "react-router-dom";

import type { NavItem } from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/utils";

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
          "group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )
      }
      title={collapsed ? title : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed ? <span>{title}</span> : null}
    </NavLink>
  );
}
