import { addDays, format } from "date-fns";

export type NaturalDateSuggestion = {
  date: string;
  label: string;
  phrase: string;
};

const ENGLISH_WEEKDAYS = new Map([
  ["sunday", 0],
  ["monday", 1],
  ["tuesday", 2],
  ["wednesday", 3],
  ["thursday", 4],
  ["friday", 5],
  ["saturday", 6],
]);

const PERSIAN_WEEKDAYS = new Map([
  ["یکشنبه", 0],
  ["دوشنبه", 1],
  ["سه شنبه", 2],
  ["سه‌شنبه", 2],
  ["چهارشنبه", 3],
  ["پنجشنبه", 4],
  ["جمعه", 5],
  ["شنبه", 6],
]);

function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function normalizePersianText(value: string): string {
  return value.replace(/\u200c/g, " ").replace(/\s+/g, " ").trim();
}

function nextWeekday(baseDate: Date, targetDay: number): Date {
  const currentDay = baseDate.getDay();
  const delta = (targetDay - currentDay + 7) % 7 || 7;
  return addDays(baseDate, delta);
}

export function detectNaturalDate(
  value: string,
  baseDate = new Date()
): NaturalDateSuggestion | null {
  const normalizedEnglish = value.toLocaleLowerCase("en-US");
  const normalizedPersian = normalizePersianText(value);

  if (/\btoday\b/.test(normalizedEnglish) || normalizedPersian.includes("امروز")) {
    return { date: toDateOnly(baseDate), label: "Today", phrase: "today" };
  }

  if (/\btomorrow\b/.test(normalizedEnglish) || normalizedPersian.includes("فردا")) {
    return {
      date: toDateOnly(addDays(baseDate, 1)),
      label: "Tomorrow",
      phrase: normalizedPersian.includes("فردا") ? "فردا" : "tomorrow",
    };
  }

  const englishNextWeekday = normalizedEnglish.match(
    /\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
  );
  if (englishNextWeekday) {
    const weekday = ENGLISH_WEEKDAYS.get(englishNextWeekday[1]);
    if (weekday !== undefined) {
      return {
        date: toDateOnly(nextWeekday(baseDate, weekday)),
        label: `Next ${englishNextWeekday[1]}`,
        phrase: englishNextWeekday[0],
      };
    }
  }

  for (const [weekdayName, weekday] of PERSIAN_WEEKDAYS) {
    if (normalizedPersian.includes(`${weekdayName} بعد`)) {
      return {
        date: toDateOnly(nextWeekday(baseDate, weekday)),
        label: `${weekdayName} بعد`,
        phrase: `${weekdayName} بعد`,
      };
    }
  }

  return null;
}
