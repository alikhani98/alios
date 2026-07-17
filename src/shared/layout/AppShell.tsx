import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { getNavigationItemByPath } from "@/shared/constants/navigation";
import { usePersistentBoolean, usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import {
  APPEARANCE_STORAGE_KEY,
  RECOVERY_MODE_ENABLED_STORAGE_KEY,
} from "@/shared/constants";
import { ErrorBoundary } from "@/shared/error";
import { RecoveryModeBanner, applyRecoveryModeUrlFlag } from "@/shared/recovery";
import {
  applyAccentColorThemeVariables,
  DEFAULT_APPEARANCE_PREFERENCE,
  parseAppearancePreference,
  resolveAppearance,
  useAccentColorPreference,
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
  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);
  const { value: appearancePreference } = usePersistentString({
    key: APPEARANCE_STORAGE_KEY,
    defaultValue: DEFAULT_APPEARANCE_PREFERENCE,
  });
  const { value: accentColorPreference } = useAccentColorPreference();
  const {
    value: recoveryModeEnabled,
    setValue: setRecoveryModeEnabled,
  } = usePersistentBoolean({
    key: RECOVERY_MODE_ENABLED_STORAGE_KEY,
    defaultValue: false,
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
      applyAccentColorThemeVariables(
        accentColorPreference,
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
  }, [appearancePreference, accentColorPreference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (applyRecoveryModeUrlFlag(window.location)) {
      setRecoveryModeEnabled(true);
    }
  }, [setRecoveryModeEnabled]);

  return (
    <div className="relative min-h-screen bg-muted/20 text-foreground alios-shell-background">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.18),transparent_18%,transparent_78%,hsl(var(--background)/0.18))] dark:bg-[linear-gradient(to_bottom,hsl(var(--background)/0.3),transparent_18%,transparent_78%,hsl(var(--background)/0.3))]" />
      <div className="relative flex min-h-screen min-w-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />

        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={closeMobileSidebar}
        />

        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-x-hidden">
          <Topbar
            title={t(currentNavigationItem.titleKey)}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            showDashboardControls={location.pathname === "/"}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-3 lg:px-4 lg:pb-6">
            <div
              key={location.pathname}
              className="alios-page-transition min-h-full space-y-4"
            >
              {recoveryModeEnabled ? (
                <RecoveryModeBanner
                  onExit={() => setRecoveryModeEnabled(false)}
                />
              ) : null}
              <ErrorBoundary resetKey={`${location.pathname}${location.search}${location.hash}`}>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
