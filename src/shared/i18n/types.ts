import type { messagesEn } from "./messages.en";

export type Language = "fa" | "en";
export type TextDirection = "rtl" | "ltr";
export type TranslationKey = keyof typeof messagesEn;
export type TranslationValues = Record<string, string | number>;

export type I18nContextValue = {
  language: Language;
  direction: TextDirection;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};
