import { useEffect, useMemo, useState, type ReactNode } from "react";

import { readStoredPreference, writeStoredPreference } from "@/shared/preferences";
import {
  DEFAULT_LANGUAGE,
  getDirection,
  I18nContext,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  translate,
} from "./i18n";
import type { I18nContextValue, Language } from "./types";

type I18nProviderProps = { children: ReactNode };

function getInitialLanguage(): Language {
  return readStoredPreference(
    LANGUAGE_STORAGE_KEY,
    (stored) => (isLanguage(stored) ? stored : DEFAULT_LANGUAGE),
    DEFAULT_LANGUAGE
  );
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const direction = getDirection(language);

  useEffect(() => {
    writeStoredPreference(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      direction,
      setLanguage: setLanguageState,
      t: (key, values) => translate(language, key, values),
    }),
    [direction, language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
