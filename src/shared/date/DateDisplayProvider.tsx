import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

import { useI18n } from "@/shared/i18n";
import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";
import {
  CALENDAR_DISPLAY_STORAGE_KEY,
  DEFAULT_CALENDAR_DISPLAY,
  formatDisplayDate,
  isCalendarDisplay,
  resolveCalendar,
} from "./formatDate";
import type { CalendarDisplay, DateDisplayContextValue } from "./types";

export const DateDisplayContext = createContext<DateDisplayContextValue | null>(
  null
);

type DateDisplayProviderProps = { children: ReactNode };

function getInitialCalendarDisplay(): CalendarDisplay {
  return readStoredPreference(
    CALENDAR_DISPLAY_STORAGE_KEY,
    (stored) =>
      isCalendarDisplay(stored) ? stored : DEFAULT_CALENDAR_DISPLAY,
    DEFAULT_CALENDAR_DISPLAY
  );
}

export function DateDisplayProvider({ children }: DateDisplayProviderProps) {
  const { language } = useI18n();
  const [calendarDisplay, setCalendarDisplayState] =
    useState<CalendarDisplay>(getInitialCalendarDisplay);
  const resolvedCalendar = resolveCalendar(calendarDisplay, language);

  useEffect(() => {
    const sync = (event: Event) => {
      if (event instanceof StorageEvent && event.key !== null && event.key !== CALENDAR_DISPLAY_STORAGE_KEY) return;
      if (event instanceof CustomEvent && event.detail?.key !== CALENDAR_DISPLAY_STORAGE_KEY) return;
      try {
        const stored = window.localStorage.getItem(CALENDAR_DISPLAY_STORAGE_KEY);
        setCalendarDisplayState(isCalendarDisplay(stored) ? stored : DEFAULT_CALENDAR_DISPLAY);
      } catch {
        // Keep the last readable calendar while storage is unavailable.
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, sync);
    };
  }, []);

  const setCalendarDisplay = (calendar: CalendarDisplay) => {
    if (!writeStoredPreference(CALENDAR_DISPLAY_STORAGE_KEY, calendar)) return false;
    setCalendarDisplayState(calendar);
    return true;
  };

  const value = useMemo<DateDisplayContextValue>(
    () => ({
      calendarDisplay,
      resolvedCalendar,
      setCalendarDisplay,
      formatDate: (date) =>
        formatDisplayDate(date, { language, calendar: resolvedCalendar }),
      formatDateTime: (date) =>
        formatDisplayDate(date, {
          language,
          calendar: resolvedCalendar,
          includeTime: true,
        }),
    }),
    [calendarDisplay, language, resolvedCalendar]
  );

  return (
    <DateDisplayContext.Provider value={value}>
      {children}
    </DateDisplayContext.Provider>
  );
}
