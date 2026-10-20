import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  removeStoredPreference,
  writeStoredPreference,
} from "./storage";

export type ViewDensityMode = "full" | "simple";

export const VIEW_DENSITY_MODE_STORAGE_KEY = "alios.viewDensityMode";
export const DEFAULT_VIEW_DENSITY_MODE: ViewDensityMode = "full";

export function parseViewDensityMode(value: string | null | undefined): ViewDensityMode {
  return value === "simple" || value === "full"
    ? value
    : DEFAULT_VIEW_DENSITY_MODE;
}

export function readStoredViewDensityMode(): ViewDensityMode {
  const storage = getPreferenceStorage();

  if (!storage) {
    return DEFAULT_VIEW_DENSITY_MODE;
  }

  try {
    return parseViewDensityMode(storage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY));
  } catch {
    return DEFAULT_VIEW_DENSITY_MODE;
  }
}

export function saveViewDensityMode(value: ViewDensityMode): boolean {
  return value === DEFAULT_VIEW_DENSITY_MODE
    ? removeStoredPreference(VIEW_DENSITY_MODE_STORAGE_KEY)
    : writeStoredPreference(VIEW_DENSITY_MODE_STORAGE_KEY, value);
}

export function resetViewDensityModePreference(): boolean {
  return removeStoredPreference(VIEW_DENSITY_MODE_STORAGE_KEY);
}

export function useViewDensityMode() {
  const [value, setValue] = useState<ViewDensityMode>(readStoredViewDensityMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateFromStorage = () => setValue(readStoredViewDensityMode());

    updateFromStorage();
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, updateFromStorage);
    window.addEventListener("storage", updateFromStorage);

    return () => {
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, updateFromStorage);
      window.removeEventListener("storage", updateFromStorage);
    };
  }, []);

  const [persistenceFailed, setPersistenceFailed] = useState(false);
  const setMode = useCallback((nextValue: ViewDensityMode) => {
    const persisted = saveViewDensityMode(nextValue);
    setPersistenceFailed(!persisted);
    if (persisted) setValue(nextValue);
  }, []);

  const reset = useCallback(() => {
    const persisted = resetViewDensityModePreference();
    setPersistenceFailed(!persisted);
    if (persisted) setValue(DEFAULT_VIEW_DENSITY_MODE);
  }, []);

  return {
    value,
    persistenceFailed,
    isFullView: value === "full",
    isSimpleView: value === "simple",
    setValue: setMode,
    reset,
  };
}
