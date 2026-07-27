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

function notifyLocalPreferenceChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, {
      detail: { key: VIEW_DENSITY_MODE_STORAGE_KEY },
    })
  );
}

export function readStoredViewDensityMode(): ViewDensityMode {
  const storage = getPreferenceStorage();

  if (!storage) {
    return DEFAULT_VIEW_DENSITY_MODE;
  }

  return parseViewDensityMode(storage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY));
}

export function saveViewDensityMode(value: ViewDensityMode) {
  const storage = getPreferenceStorage();

  if (storage) {
    if (value === DEFAULT_VIEW_DENSITY_MODE) {
      removeStoredPreference(VIEW_DENSITY_MODE_STORAGE_KEY, storage);
    } else {
      writeStoredPreference(VIEW_DENSITY_MODE_STORAGE_KEY, value, storage);
    }
    return;
  }

  notifyLocalPreferenceChange();
}

export function resetViewDensityModePreference() {
  const storage = getPreferenceStorage();

  if (storage) {
    removeStoredPreference(VIEW_DENSITY_MODE_STORAGE_KEY, storage);
    return;
  }

  notifyLocalPreferenceChange();
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

  const setMode = useCallback((nextValue: ViewDensityMode) => {
    setValue(nextValue);
    saveViewDensityMode(nextValue);
  }, []);

  const reset = useCallback(() => {
    setValue(DEFAULT_VIEW_DENSITY_MODE);
    resetViewDensityModePreference();
  }, []);

  return {
    value,
    isFullView: value === "full",
    isSimpleView: value === "simple",
    setValue: setMode,
    reset,
  };
}
