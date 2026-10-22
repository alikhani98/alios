import { useCallback, useEffect, useState } from "react";

import { writeStoredPreference } from "@/shared/preferences/storage";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

type UsePersistentStringOptions = {
  key: string;
  defaultValue: string;
};

function readStoredString(key: string, defaultValue: string): string {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export function usePersistentString({
  key,
  defaultValue,
}: UsePersistentStringOptions) {
  const [value, setValue] = useState<string>(() =>
    readStoredString(key, defaultValue)
  );

  useEffect(() => {
    const handleSync = () => {
      try {
        setValue(window.localStorage.getItem(key) ?? defaultValue);
      } catch {
        // An unavailable read must not replace the last readable value.
      }
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, [defaultValue, key]);

  const setPersistentValue = useCallback(
    (nextValue: string) => {
      setValue(nextValue);

      if (typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.setItem(key, nextValue);
        window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
      } catch {
        // Keep the value in memory if storage is unavailable.
      }
    },
    [key]
  );

  const [persistenceFailed, setPersistenceFailed] = useState(false);
  const setStoredValue = useCallback((nextValue: string): boolean => {
    const persisted = writeStoredPreference(key, nextValue);
    setPersistenceFailed(!persisted);
    if (persisted) setValue(nextValue);
    return persisted;
  }, [key]);

  return {
    persistenceFailed,
    setStoredValue,
    value,
    setValue: setPersistentValue,
  } as const;
}
