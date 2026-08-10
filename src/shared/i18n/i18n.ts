import { createContext } from "react";

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

type MessageCatalog = Record<TranslationKey, string>;

type MessageModule = Readonly<{
  messagesEn?: MessageCatalog;
  messagesFa?: MessageCatalog;
}>;

const messageCatalogs: Partial<Record<Language, MessageCatalog>> = {};
const messageCatalogPromises: Partial<Record<Language, Promise<MessageCatalog>>> =
  {};

if (import.meta.env.MODE === "test") {
  const testCatalogs = import.meta.glob<MessageModule>("./messages.*.ts", {
    eager: true,
  });
  const english = testCatalogs["./messages.en.ts"]?.messagesEn;
  const persian = testCatalogs["./messages.fa.ts"]?.messagesFa;

  if (english) {
    messageCatalogs.en = english;
  }

  if (persian) {
    messageCatalogs.fa = persian;
  }
}

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

  if (!messageCatalogPromises[language]) {
    messageCatalogPromises[language] =
      language === "fa"
        ? import("./messages.fa").then((module) => module.messagesFa)
        : import("./messages.en").then((module) => module.messagesEn);
  }

  return messageCatalogPromises[language].then((messages) => {
    messageCatalogs[language] = messages;
    return messages;
  });
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
