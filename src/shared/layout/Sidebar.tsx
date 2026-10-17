import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { aliosSurfaceMotion } from "@/shared/ui/motion";
import { cn } from "@/shared/utils/cn";

import { NavigationGroupList } from "./NavigationGroupList";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { direction, t } = useI18n();
  return (
    <aside
      className={cn(
        "alios-workspace-sidebar sticky top-0 hidden h-dvh shrink-0 p-2 transition-all duration-300 ease-in-out motion-reduce:transition-none md:flex md:flex-col",
        aliosSurfaceMotion,
        direction === "rtl" ? "md:border-l" : "md:border-r",
        collapsed ? "md:w-[5.25rem]" : "md:w-[var(--alios-sidebar-width)]"
      )}
    >
      <div className="alios-workspace-sidebar-surface flex h-full min-h-0 flex-col overflow-hidden">
        <div className={cn("alios-workspace-brand flex min-h-16 items-center justify-between gap-2 px-3", collapsed && "flex-col px-0 py-3")}>
          {!collapsed ? (
            <div className="flex min-w-0 flex-col">
              <span className="text-xl font-semibold">AliOS<span className="ms-1 text-primary" aria-hidden="true">.</span></span>
              <span className="truncate text-xs text-muted-foreground">{t("app.tagline")}</span>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-lg text-muted-foreground"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t("shell.openSidebar") : t("shell.closeSidebar")}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        <nav
          className="alios-workspace-navigation flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-4"
          aria-label={t("nav.main")}
        >
          <NavigationGroupList collapsed={collapsed} />
        </nav>
      </div>
    </aside>
  );
}
