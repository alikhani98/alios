import { useCallback, useEffect, useRef, useState } from "react";

import { writeStoredPreference } from "@/shared/preferences/storage";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

type UsePersistentBooleanOptions = {
  key: string;
  defaultValue: boolean;
  requirePersistence?: boolean;
};

export function usePersistentBoolean({
  key,
  defaultValue,
  requirePersistence = false,
}: UsePersistentBooleanOptions) {
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue === null) {
        return defaultValue;
      }

      return storedValue === "true";
    } catch {
      return defaultValue;
    }
  });

  const currentValue = useRef(value);
  currentValue.current = value;
  const [persistenceFailed, setPersistenceFailed] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const storedValue = window.localStorage.getItem(key);

        if (storedValue === null) {
          currentValue.current = defaultValue;
          setValue(defaultValue);
          return;
        }

        currentValue.current = storedValue === "true";
        setValue(currentValue.current);
      } catch {
        if (!requirePersistence) setValue(defaultValue);
      }
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, [defaultValue, key, requirePersistence]);

  useEffect(() => {
    if (requirePersistence) return;
    try {
      const serializedValue = String(value);
      const storedValue = window.localStorage.getItem(key);

      if (storedValue === serializedValue) {
        return;
      }

      window.localStorage.setItem(key, serializedValue);
      window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
    } catch {
      // Keep the boolean in memory if storage is unavailable.
    }
  }, [key, value, requirePersistence]);

  const setPersistentValue = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    const resolved = typeof next === "function" ? next(currentValue.current) : next;
    const persisted = writeStoredPreference(key, String(resolved));
    setPersistenceFailed(!persisted);
    if (persisted) {
      currentValue.current = resolved;
      setValue(resolved);
    }
    return persisted;
  }, [key]);

  return {
    value,
    persistenceFailed,
    setValue: requirePersistence ? setPersistentValue : setValue,
    toggle: () => requirePersistence
      ? setPersistentValue((current) => !current)
      : setValue((current) => !current),
  } as const;
}
