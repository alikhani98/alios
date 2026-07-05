import type {
  CalendarDisplay,
  DateFormatOptions,
  ResolvedCalendar,
} from "./types";
import type { Language } from "@/shared/i18n";

export const CALENDAR_DISPLAY_STORAGE_KEY = "alios.calendarDisplay";
export const DEFAULT_CALENDAR_DISPLAY: CalendarDisplay = "auto";

export function isCalendarDisplay(value: unknown): value is CalendarDisplay {
  return value === "auto" || value === "gregorian" || value === "jalali";
}

export function resolveCalendar(
  display: CalendarDisplay,
  language: Language
): ResolvedCalendar {
  if (display !== "auto") return display;
  return language === "fa" ? "jalali" : "gregorian";
}

function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(dateOnly ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDisplayDate(
  value: string | Date,
  { language, calendar, includeTime = false }: DateFormatOptions
): string {
  const parsed = parseDate(value);
  if (!parsed) return typeof value === "string" ? value : "";

  const locale = language === "fa" ? "fa-IR" : "en-US";
  const calendarName = calendar === "jalali" ? "persian" : "gregory";
  return new Intl.DateTimeFormat(`${locale}-u-ca-${calendarName}`, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(parsed);
}
