import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { ResolvedCalendar } from "@/shared/date";
import type { Language } from "@/shared/i18n";
import type { Task } from "@/shared/types";

export type CalendarMonthCell = {
  date: Date;
  isoDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  taskCount: number;
};

export type CalendarMonthTaskGroups = Record<string, Task[]>;

export type CalendarDisplayContext = {
  language: Language;
  calendar: ResolvedCalendar;
};

export type CalendarGridOptions = {
  today?: Date;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

const CALENDAR_LOCALE: Record<Language, string> = {
  en: "en-US",
  fa: "fa-IR",
};

function getLocale(language: Language, calendar: ResolvedCalendar) {
  const locale = CALENDAR_LOCALE[language];
  const calendarName = calendar === "jalali" ? "persian" : "gregory";
  return `${locale}-u-ca-${calendarName}`;
}

export function getWeekStartsOn(language: Language): 0 | 6 {
  return language === "fa" ? 6 : 0;
}

export function groupTasksByDate(tasks: ReadonlyArray<Task>): CalendarMonthTaskGroups {
  return tasks.reduce<CalendarMonthTaskGroups>((groups, task) => {
    if (!task.dueDate) return groups;
    if (!groups[task.dueDate]) {
      groups[task.dueDate] = [];
    }
    groups[task.dueDate].push(task);
    return groups;
  }, {});
}

export function buildMonthGrid(
  referenceDate: Date,
  groupedTasks: CalendarMonthTaskGroups,
  options: CalendarGridOptions = {}
): CalendarMonthCell[] {
  const monthStart = startOfMonth(referenceDate);
  const firstCell = startOfWeek(monthStart, {
    weekStartsOn: options.weekStartsOn ?? 0,
  });
  const today = options.today ?? new Date();

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstCell, index);
    const isoDate = format(date, "yyyy-MM-dd");

    return {
      date,
      isoDate,
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isSameDay(date, today),
      taskCount: groupedTasks[isoDate]?.length ?? 0,
    };
  });
}

export function shiftMonth(date: Date, amount: number) {
  return addMonths(date, amount);
}

export function formatMonthTitle(
  date: Date,
  { language, calendar }: CalendarDisplayContext
): string {
  return new Intl.DateTimeFormat(getLocale(language, calendar), {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDayNumber(
  date: Date,
  { language, calendar }: CalendarDisplayContext
): string {
  return new Intl.DateTimeFormat(getLocale(language, calendar), {
    day: "numeric",
  }).format(date);
}

export function buildWeekdayLabels(
  date: Date,
  context: CalendarDisplayContext
): string[] {
  const firstWeekDay = startOfWeek(startOfMonth(date), {
    weekStartsOn: getWeekStartsOn(context.language),
  });

  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(getLocale(context.language, context.calendar), {
      weekday: "short",
    }).format(addDays(firstWeekDay, index))
  );
}
