import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { getNavigationItemByPath } from "@/shared/constants/navigation";
import { usePersistentBoolean, usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import { APPEARANCE_STORAGE_KEY } from "@/shared/constants";
import {
  DEFAULT_APPEARANCE_PREFERENCE,
  parseAppearancePreference,
  resolveAppearance,
} from "@/shared/preferences";

import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "alios.sidebar.collapsed";

export function AppShell() {
  const { t } = useI18n();
  const location = useLocation();
  const currentNavigationItem = getNavigationItemByPath(location.pathname);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { value: appearancePreference } = usePersistentString({
    key: APPEARANCE_STORAGE_KEY,
    defaultValue: DEFAULT_APPEARANCE_PREFERENCE,
  });

  const {
    value: sidebarCollapsed,
    toggle: toggleSidebarCollapsed,
  } = usePersistentBoolean({
    key: SIDEBAR_COLLAPSED_STORAGE_KEY,
    defaultValue: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolvedAppearance = resolveAppearance(
        parseAppearancePreference(appearancePreference),
        mediaQuery.matches
      );

      document.documentElement.classList.toggle(
        "dark",
        resolvedAppearance === "dark"
      );
    };

    applyTheme();

    if (parseAppearancePreference(appearancePreference) !== "system") {
      return;
    }

    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [appearancePreference]);

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
