import { useCallback, useEffect, useState } from "react";

import {
  ACCENT_COLOR_STORAGE_KEY,
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants/preferences";

export type AccentColorPreference =
  | "default"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "slate";

export type AccentColorThemeVariables = {
  primary: string;
  primaryForeground: string;
  ring: string;
};

export const DEFAULT_ACCENT_COLOR_PREFERENCE: AccentColorPreference = "default";

export const accentColorPreferences: ReadonlyArray<AccentColorPreference> = [
  "default",
  "violet",
  "rose",
  "amber",
  "emerald",
  "slate",
];

const accentColorPalette: Record<
  AccentColorPreference,
  {
    light: AccentColorThemeVariables;
    dark: AccentColorThemeVariables;
  }
> = {
  default: {
    light: {
      primary: "221 83% 53%",
      primaryForeground: "210 40% 98%",
      ring: "221 83% 53%",
    },
    dark: {
      primary: "217 91% 60%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "217 91% 60%",
    },
  },
  violet: {
    light: {
      primary: "262 83% 58%",
      primaryForeground: "210 40% 98%",
      ring: "262 83% 58%",
    },
    dark: {
      primary: "262 83% 68%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "262 83% 68%",
    },
  },
  rose: {
    light: {
      primary: "346 77% 55%",
      primaryForeground: "210 40% 98%",
      ring: "346 77% 55%",
    },
    dark: {
      primary: "346 86% 68%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "346 86% 68%",
    },
  },
  amber: {
    light: {
      primary: "38 92% 50%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "38 92% 50%",
    },
    dark: {
      primary: "38 92% 58%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "38 92% 58%",
    },
  },
  emerald: {
    light: {
      primary: "158 64% 36%",
      primaryForeground: "210 40% 98%",
      ring: "158 64% 36%",
    },
    dark: {
      primary: "158 64% 46%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "158 64% 46%",
    },
  },
  slate: {
    light: {
      primary: "215 16% 47%",
      primaryForeground: "210 40% 98%",
      ring: "215 16% 47%",
    },
    dark: {
      primary: "215 16% 64%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "215 16% 64%",
    },
  },
};

function isAccentColorPreference(value: unknown): value is AccentColorPreference {
  return (
    typeof value === "string" &&
    accentColorPreferences.includes(value as AccentColorPreference)
  );
}

export function normalizeAccentColorPreference(
  value: unknown
): AccentColorPreference {
  return isAccentColorPreference(value)
    ? value
    : DEFAULT_ACCENT_COLOR_PREFERENCE;
}

export function parseAccentColorPreference(
  value: string | null | undefined
): AccentColorPreference {
  return normalizeAccentColorPreference(value);
}

function getSafeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredAccentColorPreference(): AccentColorPreference {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_COLOR_PREFERENCE;
  }

  const storage = getSafeLocalStorage();

  if (!storage) {
    return DEFAULT_ACCENT_COLOR_PREFERENCE;
  }

  try {
    return parseAccentColorPreference(storage.getItem(ACCENT_COLOR_STORAGE_KEY));
  } catch {
    return DEFAULT_ACCENT_COLOR_PREFERENCE;
  }
}

export function getAccentColorThemeVariables(
  preference: AccentColorPreference,
  isDarkMode: boolean
): AccentColorThemeVariables {
  return accentColorPalette[preference][isDarkMode ? "dark" : "light"];
}

export function applyAccentColorThemeVariables(
  preference: AccentColorPreference,
  isDarkMode: boolean
) {
  if (typeof document === "undefined") {
    return;
  }

  const variables = getAccentColorThemeVariables(preference, isDarkMode);

  document.documentElement.style.setProperty("--primary", variables.primary);
  document.documentElement.style.setProperty(
    "--primary-foreground",
    variables.primaryForeground
  );
  document.documentElement.style.setProperty("--ring", variables.ring);
}

function writeStoredAccentColorPreference(preference: AccentColorPreference) {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(ACCENT_COLOR_STORAGE_KEY, preference);
    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  } catch {
    // Keep the value in memory if storage is unavailable.
  }
}

function removeStoredAccentColorPreference() {
  const storage = getSafeLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(ACCENT_COLOR_STORAGE_KEY);
    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  } catch {
    // Keep the value in memory if storage is unavailable.
  }
}

export function resetAccentColorPreference() {
  removeStoredAccentColorPreference();
}

export function useAccentColorPreference() {
  const [value, setValue] = useState<AccentColorPreference>(() =>
    readStoredAccentColorPreference()
  );

  useEffect(() => {
    const handleSync = () => {
      setValue(readStoredAccentColorPreference());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, []);

  const setAccentColorPreference = useCallback(
    (nextValue: AccentColorPreference) => {
      const normalizedValue = normalizeAccentColorPreference(nextValue);
      setValue(normalizedValue);
      writeStoredAccentColorPreference(normalizedValue);
    },
    []
  );

  return {
    value,
    setValue: setAccentColorPreference,
  } as const;
}
