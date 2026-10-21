import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/shared/ui/button";

import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";
import {
  DEFAULT_LANGUAGE,
  getDirection,
  getLoadedMessages,
  I18nContext,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  loadMessages,
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
  const [initialLanguage] = useState<Language>(getInitialLanguage);
  const [language, setLanguageState] = useState(initialLanguage);
  const [messagesReady, setMessagesReady] = useState(
    () => getLoadedMessages(language) !== null
  );
  const [failure, setFailure] = useState<"load" | "storage" | null>(null);
  const activeLanguage = useRef<Language | null>(messagesReady ? language : null);
  const requestedLanguage = useRef(initialLanguage);
  const requestId = useRef(0);
  const mounted = useRef(false);
  const direction = getDirection(language);

  const prepareLanguage = useCallback((nextLanguage: Language, initial = false) => {
    const request = ++requestId.current;
    requestedLanguage.current = nextLanguage;
    setFailure(null);
    if (activeLanguage.current === nextLanguage) return;

    const isCurrent = () => mounted.current && request === requestId.current;
    const activate = () => {
      if (!isCurrent()) return;
      const saved = writeStoredPreference(LANGUAGE_STORAGE_KEY, nextLanguage);
      // Initial local-only rendering must remain available even if storage is locked.
      if (!saved && !initial) {
        setFailure("storage");
        return;
      }
      activeLanguage.current = nextLanguage;
      setLanguageState(nextLanguage);
      setMessagesReady(true);
    };

    if (getLoadedMessages(nextLanguage)) {
      activate();
    } else {
      void loadMessages(nextLanguage).then(activate, () => {
        if (isCurrent()) setFailure("load");
      });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (activeLanguage.current === null) {
      prepareLanguage(initialLanguage, true);
    } else {
      writeStoredPreference(LANGUAGE_STORAGE_KEY, activeLanguage.current);
    }
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, [initialLanguage, prepareLanguage]);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      direction,
      setLanguage: prepareLanguage,
      t: (key, values) => translate(language, key, values),
    }),
    [direction, language, prepareLanguage]
  );

  // This fallback must also work before any catalog is available.
  const retryLabel = language === "fa" ? "تلاش دوباره" : "Retry";
  const failureText = failure === "storage"
    ? language === "fa"
      ? "ترجیح زبان ذخیره نشد. زبان فعلی حفظ شده است. دوباره تلاش کنید."
      : "The language preference could not be saved. The current language is unchanged. Try again."
    : language === "fa"
      ? "زبان بارگذاری نشد. دوباره تلاش کنید."
      : "The language could not be loaded. Try again.";
  const failureNotice = failure ? (
    <div role="alert" dir={direction} className="space-y-3 p-4 pb-24 text-sm text-destructive sm:pb-4">
      <p>{failureText}</p>
      {failure === "load" ? (
        <p className="text-muted-foreground">
          {language === "fa"
            ? "اگر تلاش دوباره نتیجه نداد، صفحه را بارگذاری مجدد کنید؛ ویرایش‌های ذخیره‌نشده از دست می‌روند."
            : "If retry still fails, reload the page; unsaved edits will be lost."}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => prepareLanguage(requestedLanguage.current, activeLanguage.current === null)}>
          {retryLabel}
        </Button>
        {failure === "load" ? (
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            {language === "fa" ? "بارگذاری مجدد صفحه" : "Reload page"}
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  if (!messagesReady) {
    if (failureNotice) return failureNotice;
    return (
      <div
        aria-busy="true"
        className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground"
        dir={direction}
        role="status"
      >
        {language === "fa" ? "در حال بارگذاری زبان…" : "Loading language…"}
      </div>
    );
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
      {failureNotice}
    </I18nContext.Provider>
  );
}
