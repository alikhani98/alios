import type { Language } from "@/shared/i18n";

export type CalendarDisplay = "auto" | "gregorian" | "jalali";
export type ResolvedCalendar = Exclude<CalendarDisplay, "auto">;

export type DateDisplayContextValue = {
  calendarDisplay: CalendarDisplay;
  resolvedCalendar: ResolvedCalendar;
  setCalendarDisplay: (calendar: CalendarDisplay) => void;
  formatDate: (value: string | Date) => string;
  formatDateTime: (value: string | Date) => string;
};

export type DateFormatOptions = {
  language: Language;
  calendar: ResolvedCalendar;
  includeTime?: boolean;
};
