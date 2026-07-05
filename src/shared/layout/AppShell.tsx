import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { getNavigationItemByPath } from "@/shared/constants/navigation";
import { usePersistentBoolean } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";

import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "alios.sidebar.collapsed";

export function AppShell() {
  const { t } = useI18n();
  const location = useLocation();
  const currentNavigationItem = getNavigationItemByPath(location.pathname);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const {
    value: sidebarCollapsed,
    toggle: toggleSidebarCollapsed,
  } = usePersistentBoolean({
    key: SIDEBAR_COLLAPSED_STORAGE_KEY,
    defaultValue: false,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30 text-foreground">
      <div className="flex min-h-screen min-w-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />

        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={t(currentNavigationItem.titleKey)}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
