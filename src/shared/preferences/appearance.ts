export type AppearancePreference = "light" | "dark" | "system" | "scheduled";
export type ResolvedAppearance = "light" | "dark";
export type AppearanceSchedule = {
  start: string;
  end: string;
};

export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreference = "system";
export const DEFAULT_APPEARANCE_SCHEDULE: AppearanceSchedule = {
  start: "20:00",
  end: "07:00",
};

export function isAppearancePreference(
  value: unknown
): value is AppearancePreference {
  return (
    value === "light" ||
    value === "dark" ||
    value === "system" ||
    value === "scheduled"
  );
}

export function parseAppearancePreference(
  value: string | null | undefined
): AppearancePreference {
  return isAppearancePreference(value) ? value : DEFAULT_APPEARANCE_PREFERENCE;
}

export function resolveAppearance(
  preference: AppearancePreference,
  prefersDark: boolean,
  schedule: AppearanceSchedule = DEFAULT_APPEARANCE_SCHEDULE,
  now: Date = new Date()
): ResolvedAppearance {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }

  if (preference === "scheduled") {
    return isTimeWithinAppearanceSchedule(now, schedule) ? "dark" : "light";
  }

  return preference;
}

function parseClockTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function normalizeAppearanceSchedule(
  schedule: Partial<AppearanceSchedule>
): AppearanceSchedule {
  return {
    start:
      parseClockTime(schedule.start ?? "") === null
        ? DEFAULT_APPEARANCE_SCHEDULE.start
        : schedule.start ?? DEFAULT_APPEARANCE_SCHEDULE.start,
    end:
      parseClockTime(schedule.end ?? "") === null
        ? DEFAULT_APPEARANCE_SCHEDULE.end
        : schedule.end ?? DEFAULT_APPEARANCE_SCHEDULE.end,
  };
}

export function isTimeWithinAppearanceSchedule(
  now: Date,
  schedule: AppearanceSchedule
): boolean {
  const normalizedSchedule = normalizeAppearanceSchedule(schedule);
  const start = parseClockTime(normalizedSchedule.start);
  const end = parseClockTime(normalizedSchedule.end);
  if (start === null || end === null) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) {
    return true;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}
