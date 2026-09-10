import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences";

export type ResourceViewMode = "list" | "grid";

export const RESOURCE_VIEW_MODE_STORAGE_KEY = "alios.resources.viewMode";
export const DEFAULT_RESOURCE_VIEW_MODE: ResourceViewMode = "list";

export function parseResourceViewMode(
  value: string | null | undefined
): ResourceViewMode {
  return value === "grid" || value === "list"
    ? value
    : DEFAULT_RESOURCE_VIEW_MODE;
}

export function readResourceViewMode(): ResourceViewMode {
  return readStoredPreference(
    RESOURCE_VIEW_MODE_STORAGE_KEY,
    parseResourceViewMode,
    DEFAULT_RESOURCE_VIEW_MODE
  );
}

export function saveResourceViewMode(value: ResourceViewMode): void {
  writeStoredPreference(
    RESOURCE_VIEW_MODE_STORAGE_KEY,
    value,
    getPreferenceStorage()
  );
}

export function useResourceViewMode() {
  const [value, setValue] = useState<ResourceViewMode>(readResourceViewMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateFromStorage = () => setValue(readResourceViewMode());
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, updateFromStorage);
    window.addEventListener("storage", updateFromStorage);

    return () => {
      window.removeEventListener(
        LOCAL_PREFERENCE_CHANGE_EVENT,
        updateFromStorage
      );
      window.removeEventListener("storage", updateFromStorage);
    };
  }, []);

  const setMode = useCallback((nextValue: ResourceViewMode) => {
    setValue(nextValue);
    saveResourceViewMode(nextValue);
  }, []);

  return { value, setValue: setMode };
}
