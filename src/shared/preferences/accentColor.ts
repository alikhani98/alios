import { useCallback, useEffect, useState } from "react";

import {
  ACCENT_COLOR_STORAGE_KEY,
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  removeStoredPreference,
  writeStoredPreference,
} from "./storage";

export type AccentColorPreference =
  | "default"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "slate"
  | "caspian"
  | "pomegranate"
  | "saffron"
  | "herb";

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
  "caspian",
  "pomegranate",
  "saffron",
  "herb",
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
  caspian: {
    light: {
      primary: "221 38% 15%",
      primaryForeground: "40 47% 94%",
      ring: "221 38% 15%",
    },
    dark: {
      primary: "40 47% 94%",
      primaryForeground: "221 38% 15%",
      ring: "40 47% 94%",
    },
  },
  pomegranate: {
    light: {
      primary: "353 51% 46%",
      primaryForeground: "210 40% 98%",
      ring: "353 51% 46%",
    },
    dark: {
      primary: "353 64% 65%",
      primaryForeground: "221 38% 15%",
      ring: "353 64% 65%",
    },
  },
  saffron: {
    light: {
      primary: "41 80% 53%",
      primaryForeground: "221 38% 15%",
      ring: "41 80% 53%",
    },
    dark: {
      primary: "41 84% 64%",
      primaryForeground: "221 38% 15%",
      ring: "41 84% 64%",
    },
  },
  herb: {
    light: {
      primary: "134 19% 46%",
      primaryForeground: "210 40% 98%",
      ring: "134 19% 46%",
    },
    dark: {
      primary: "134 24% 58%",
      primaryForeground: "221 38% 15%",
      ring: "134 24% 58%",
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

function readStoredAccentColorPreference(): AccentColorPreference {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_COLOR_PREFERENCE;
  }

  const storage = getPreferenceStorage();

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
  writeStoredPreference(ACCENT_COLOR_STORAGE_KEY, preference);
}

function removeStoredAccentColorPreference() {
  removeStoredPreference(ACCENT_COLOR_STORAGE_KEY);
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
