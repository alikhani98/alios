import { createContext, useMemo, useState, type ReactNode } from "react";

import { useI18n } from "@/shared/i18n";
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
  const stored = localStorage.getItem(CALENDAR_DISPLAY_STORAGE_KEY);
  return isCalendarDisplay(stored) ? stored : DEFAULT_CALENDAR_DISPLAY;
}

export function DateDisplayProvider({ children }: DateDisplayProviderProps) {
  const { language } = useI18n();
  const [calendarDisplay, setCalendarDisplayState] =
    useState<CalendarDisplay>(getInitialCalendarDisplay);
  const resolvedCalendar = resolveCalendar(calendarDisplay, language);

  const setCalendarDisplay = (calendar: CalendarDisplay) => {
    localStorage.setItem(CALENDAR_DISPLAY_STORAGE_KEY, calendar);
    setCalendarDisplayState(calendar);
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
