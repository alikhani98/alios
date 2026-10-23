import { createContext } from "react";

import { loadRetryCatalog } from "./catalogRetry";

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

export type MessageCatalog = Record<TranslationKey, string>;

const messageCatalogs: Partial<Record<Language, MessageCatalog>> = {};
const messageCatalogPromises: Partial<Record<Language, Promise<MessageCatalog>>> =
  {};
const catalogFailureCounts: Partial<Record<Language, number>> = {};

export function isLanguage(value: unknown): value is Language {
  return value === "fa" || value === "en";
}

export function getDirection(language: Language): TextDirection {
  return language === "fa" ? "rtl" : "ltr";
}

export function getLoadedMessages(language: Language): MessageCatalog | null {
  return messageCatalogs[language] ?? null;
}

export function loadMessages(language: Language): Promise<MessageCatalog> {
  if (messageCatalogs[language]) {
    return Promise.resolve(messageCatalogs[language]);
  }

  const pending = messageCatalogPromises[language];
  if (pending) return pending;

  const previousFailures = catalogFailureCounts[language] ?? 0;
  const request = (language === "fa"
    ? import("./messages.fa").then((module) => module.messagesFa)
    : import("./messages.en").then((module) => module.messagesEn)
  ).catch((error: unknown) => {
    if (previousFailures === 0) throw error;
    return loadRetryCatalog(language, previousFailures);
  }).then((messages) => {
    messageCatalogs[language] = messages;
    delete catalogFailureCounts[language];
    return messages;
  }, (error: unknown) => {
    // A rejected request must not permanently poison future explicit retries.
    delete messageCatalogPromises[language];
    catalogFailureCounts[language] = previousFailures + 1;
    throw error;
  });
  messageCatalogPromises[language] = request;
  return request;
}

export function translate(
  language: Language,
  key: TranslationKey,
  values: TranslationValues = {}
): string {
  const messages = getLoadedMessages(language);
  const template = messages?.[key] ?? key;
  return Object.entries(values).reduce(
    (message, [name, value]) =>
      message.split(`{${name}}`).join(String(value)),
    template
  );
}
