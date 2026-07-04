import { createContext } from "react";

import { messagesEn } from "./messages.en";
import { messagesFa } from "./messages.fa";
import type {
  I18nContextValue,
  Language,
  TextDirection,
  TranslationKey,
  TranslationValues,
} from "./types";

export const LANGUAGE_STORAGE_KEY = "alios.language";
export const DEFAULT_LANGUAGE: Language = "fa";

export const I18nContext = createContext<I18nContextValue | null>(null);

export function isLanguage(value: unknown): value is Language {
  return value === "fa" || value === "en";
}

export function getDirection(language: Language): TextDirection {
  return language === "fa" ? "rtl" : "ltr";
}

export function translate(
  language: Language,
  key: TranslationKey,
  values: TranslationValues = {}
): string {
  const messages = language === "fa" ? messagesFa : messagesEn;
  return Object.entries(values).reduce(
    (message, [name, value]) =>
      message.split(`{${name}}`).join(String(value)),
    messages[key]
  );
}
