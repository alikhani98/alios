import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { mainNavigation } from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils";

import { NavigationLink } from "./NavigationLink";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { direction, t } = useI18n();
  return (
    <aside
      className={cn(
        "hidden min-h-screen bg-card transition-all duration-300 ease-in-out md:flex md:flex-col",
        direction === "rtl" ? "border-l" : "border-r",
        collapsed ? "w-[4.75rem]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">AliOS</span>
            <span className="text-xs text-muted-foreground">{t("app.tagline")}</span>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
            A
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
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

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label={t("nav.main")}>
        {mainNavigation.map((item) => (
          <NavigationLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
