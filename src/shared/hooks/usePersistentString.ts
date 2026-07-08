import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants";

type UsePersistentStringOptions = {
  key: string;
  defaultValue: string;
};

function readStoredString(key: string, defaultValue: string): string {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const storedValue = window.localStorage.getItem(key);
  return storedValue ?? defaultValue;
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
      setValue(readStoredString(key, defaultValue));
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

      window.localStorage.setItem(key, nextValue);
      window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
    },
    [key]
  );

  return {
    value,
    setValue: setPersistentValue,
  } as const;
}
