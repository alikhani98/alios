import { addDays, format } from "date-fns";

export type NaturalDateSuggestion = {
  date?: string;
  label?: string;
  phrase: string;
  estimatedMinutes?: number;
  scheduledStartTime?: string;
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
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nextWeekday(baseDate: Date, targetDay: number): Date {
  const currentDay = baseDate.getDay();
  const delta = (targetDay - currentDay + 7) % 7 || 7;
  return addDays(baseDate, delta);
}

function detectDateSuggestion(
  value: string,
  normalizedEnglish: string,
  normalizedPersian: string,
  baseDate: Date
): NaturalDateSuggestion | null {
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

  return value.trim() ? null : null;
}

function clampDuration(minutes: number): number | undefined {
  if (!Number.isFinite(minutes)) {
    return undefined;
  }

  const rounded = Math.round(minutes);
  return rounded >= 1 && rounded <= 720 ? rounded : undefined;
}

function detectDuration(value: string): { minutes: number; phrase: string } | null {
  const match = value.match(
    /(?:\bfor\s*)?(\d{1,3})\s*(?:minutes?|mins?|min\b|دقیقه)(?:\s*ای)?/i
  );
  if (!match) {
    return null;
  }

  const minutes = clampDuration(Number(match[1]));
  return minutes ? { minutes, phrase: match[0].trim() } : null;
}

const PERSIAN_HOUR_WORDS = new Map([
  ["یک", 1],
  ["دو", 2],
  ["سه", 3],
  ["چهار", 4],
  ["پنج", 5],
  ["شش", 6],
  ["هفت", 7],
  ["هشت", 8],
  ["نه", 9],
  ["ده", 10],
  ["یازده", 11],
  ["دوازده", 12],
]);

function formatClockTime(hour: number, minute = 0, period?: "am" | "pm"): string | undefined {
  if (period === "pm" && hour < 12) {
    hour += 12;
  } else if (period === "am" && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return undefined;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function detectClockTime(value: string): { time: string; phrase: string } | null {
  const englishMatch = value.match(
    /\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
  );
  if (englishMatch) {
    const matchedPhrase = englishMatch[0].trim();
    const hasTimeCue =
      matchedPhrase.toLocaleLowerCase("en-US").startsWith("at ") ||
      /\bat\s*$/i.test(value.slice(0, englishMatch.index)) ||
      Boolean(englishMatch[3]) ||
      matchedPhrase.includes(":");
    if (hasTimeCue) {
      const time = formatClockTime(
        Number(englishMatch[1]),
        englishMatch[2] ? Number(englishMatch[2]) : 0,
        englishMatch[3]?.toLocaleLowerCase("en-US") as "am" | "pm" | undefined
      );
      if (time) {
        return { time, phrase: matchedPhrase };
      }
    }
  }

  const persianNumberMatch = value.match(/ساعت\s+(\d{1,2})(?::(\d{2}))?\s*(صبح|عصر|بعدازظهر|بعد از ظهر|شب)?/);
  if (persianNumberMatch) {
    const period = persianNumberMatch[3];
    const time = formatClockTime(
      Number(persianNumberMatch[1]),
      persianNumberMatch[2] ? Number(persianNumberMatch[2]) : 0,
      period && ["عصر", "بعدازظهر", "بعد از ظهر", "شب"].includes(period) ? "pm" : undefined
    );
    if (time) {
      return { time, phrase: persianNumberMatch[0].trim() };
    }
  }

  const persianWordMatch = value.match(/ساعت\s+(یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده)\s*(صبح|عصر|بعدازظهر|بعد از ظهر|شب)?/);
  if (persianWordMatch) {
    const hour = PERSIAN_HOUR_WORDS.get(persianWordMatch[1]);
    const period = persianWordMatch[2];
    const time =
      hour === undefined
        ? undefined
        : formatClockTime(
            hour,
            0,
            period && ["عصر", "بعدازظهر", "بعد از ظهر", "شب"].includes(period) ? "pm" : undefined
          );
    if (time) {
      return { time, phrase: persianWordMatch[0].trim() };
    }
  }

  return null;
}

export function detectNaturalDate(
  value: string,
  baseDate = new Date()
): NaturalDateSuggestion | null {
  const normalizedEnglish = value.toLocaleLowerCase("en-US");
  const normalizedPersian = normalizePersianText(value);
  const dateSuggestion = detectDateSuggestion(
    value,
    normalizedEnglish,
    normalizedPersian,
    baseDate
  );
  const durationSuggestion = detectDuration(normalizedPersian);
  const timeSuggestion = detectClockTime(normalizedPersian);

  if (!dateSuggestion && !durationSuggestion && !timeSuggestion) {
    return null;
  }

  return {
    ...dateSuggestion,
    phrase: [dateSuggestion?.phrase, timeSuggestion?.phrase, durationSuggestion?.phrase]
      .filter(Boolean)
      .join(" · "),
    scheduledStartTime: timeSuggestion?.time,
    estimatedMinutes: durationSuggestion?.minutes,
  };
}
