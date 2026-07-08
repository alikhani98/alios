import { useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants";

type UsePersistentBooleanOptions = {
  key: string;
  defaultValue: boolean;
};

export function usePersistentBoolean({
  key,
  defaultValue,
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

  useEffect(() => {
    const handleSync = () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const storedValue = window.localStorage.getItem(key);

        if (storedValue === null) {
          setValue(defaultValue);
          return;
        }

        setValue(storedValue === "true");
      } catch {
        setValue(defaultValue);
      }
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, [defaultValue, key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(value));
      window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
    } catch {
      // Keep the boolean in memory if storage is unavailable.
    }
  }, [key, value]);

  return {
    value,
    setValue,
    toggle: () => setValue((currentValue) => !currentValue),
  } as const;
}
