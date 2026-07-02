import { useCallback, useEffect, useState } from "react";

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

    const storedValue = window.localStorage.getItem(key);

    if (storedValue === null) {
      return defaultValue;
    }

    return storedValue === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(key, String(value));
  }, [key, value]);

  const toggle = useCallback(() => {
    setValue((currentValue) => !currentValue);
  }, []);

  return {
    value,
    setValue,
    toggle,
  } as const;
}
