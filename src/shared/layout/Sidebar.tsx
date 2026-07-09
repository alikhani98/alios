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
        "sticky top-0 hidden h-screen shrink-0 p-2 transition-all duration-300 ease-in-out motion-reduce:transition-none md:flex md:flex-col",
        direction === "rtl" ? "md:border-l" : "md:border-r",
        collapsed ? "md:w-[5.25rem]" : "md:w-72"
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border bg-card/85 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
          {!collapsed ? (
            <div className="flex min-w-0 flex-col">
              <span className="text-lg font-semibold tracking-tight">AliOS</span>
              <span className="truncate text-xs text-muted-foreground">{t("app.tagline")}</span>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
              A
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 border border-transparent bg-background/70 shadow-sm hover:bg-background"
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

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3" aria-label={t("nav.main")}>
          {mainNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
