export const MORNING_WARMUP_START_MINUTES = 5 * 60;
export const MORNING_WARMUP_END_MINUTES = 7 * 60;

export type MorningWarmupPreference = {
  enabled: boolean;
  dismissedDate?: string;
};

export function parseMorningWarmupEnabledPreference(
  value: string | null | undefined
): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return true;
}

export function isLocalDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDismissedDate(value: string | null | undefined) {
  if (!value || !isLocalDateKey(value)) {
    return undefined;
  }

  return value;
}

export function isTimeWithinWindow(
  date: Date,
  startMinutes: number,
  endMinutes: number
): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function shouldShowMorningWarmupNudge(
  now: Date,
  preference: MorningWarmupPreference
): boolean {
  if (!preference.enabled) {
    return false;
  }

  if (
    !isTimeWithinWindow(
      now,
      MORNING_WARMUP_START_MINUTES,
      MORNING_WARMUP_END_MINUTES
    )
  ) {
    return false;
  }

  return preference.dismissedDate !== getLocalDateKey(now);
}

export function dismissMorningWarmupForToday(date: Date): string {
  return getLocalDateKey(date);
}
