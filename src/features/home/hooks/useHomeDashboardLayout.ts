import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

import {
  HOME_DASHBOARD_LAYOUT_STORAGE_KEY,
  getDefaultDashboardLayout,
  homeDashboardSectionIds,
  moveDashboardSectionDown,
  moveDashboardSectionUp,
  normalizeDashboardLayout,
  resetDashboardLayout,
  toggleDashboardSectionVisibility,
  type HomeDashboardLayout,
  type HomeDashboardSectionId,
} from "../dashboardLayout";

function getSafeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredDashboardLayout(): HomeDashboardLayout {
  if (typeof window === "undefined") {
    return getDefaultDashboardLayout();
  }

  const storage = getSafeLocalStorage();

  if (!storage) {
    return getDefaultDashboardLayout();
  }

  try {
    const storedValue = storage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY);

    if (!storedValue) {
      return getDefaultDashboardLayout();
    }

    return normalizeDashboardLayout(JSON.parse(storedValue), homeDashboardSectionIds);
  } catch {
    return getDefaultDashboardLayout();
  }
}

function writeStoredDashboardLayout(layout: HomeDashboardLayout) {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      HOME_DASHBOARD_LAYOUT_STORAGE_KEY,
      JSON.stringify(layout)
    );
    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  } catch {
    // Keep the layout in memory if storage is unavailable.
  }
}

function removeStoredDashboardLayout() {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY);
    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  } catch {
    // Keep the layout in memory if storage is unavailable.
  }
}

export function resetHomeDashboardLayoutPreference() {
  removeStoredDashboardLayout();
}

export function useHomeDashboardLayout() {
  const [layout, setLayout] = useState<HomeDashboardLayout>(() =>
    readStoredDashboardLayout()
  );

  useEffect(() => {
    const handleSync = () => {
      setLayout(readStoredDashboardLayout());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, []);

  const updateLayout = useCallback((nextLayout: HomeDashboardLayout) => {
    const normalizedLayout = normalizeDashboardLayout(
      nextLayout,
      homeDashboardSectionIds
    );

    setLayout(normalizedLayout);
    writeStoredDashboardLayout(normalizedLayout);
  }, []);

  const moveSectionUp = useCallback(
    (sectionId: HomeDashboardSectionId) => {
      updateLayout(moveDashboardSectionUp(layout, sectionId));
    },
    [layout, updateLayout]
  );

  const moveSectionDown = useCallback(
    (sectionId: HomeDashboardSectionId) => {
      updateLayout(moveDashboardSectionDown(layout, sectionId));
    },
    [layout, updateLayout]
  );

  const toggleSectionVisibility = useCallback(
    (sectionId: HomeDashboardSectionId) => {
      updateLayout(toggleDashboardSectionVisibility(layout, sectionId));
    },
    [layout, updateLayout]
  );

  const resetLayout = useCallback(() => {
    const defaultLayout = resetDashboardLayout(homeDashboardSectionIds);
    setLayout(defaultLayout);
    removeStoredDashboardLayout();
  }, []);

  return {
    layout,
    moveSectionUp,
    moveSectionDown,
    toggleSectionVisibility,
    resetLayout,
    isDefaultLayout:
      JSON.stringify(layout) === JSON.stringify(getDefaultDashboardLayout()),
  } as const;
}
