import { getBackupAgeInDays } from "@/shared/preferences/backupStatus";
import {
  readStoredPreference,
  writeStoredPreference,
  type PreferenceStorage,
} from "@/shared/preferences/storage";

export const HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY =
  "alios.home.backupReminder.dismissedUntil";

const DISMISS_DURATION_IN_DAYS = 3;
const REMINDER_THRESHOLD_IN_DAYS = 7;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function parseStoredDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function readHomeBackupReminderDismissedUntil(
  storage?: PreferenceStorage | null
): string | null {
  return readStoredPreference(
    HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY,
    parseStoredDate,
    null,
    storage
  );
}

export function isHomeBackupReminderDismissed(
  dismissedUntil: string | null | undefined,
  referenceDate = new Date()
): boolean {
  if (!dismissedUntil) {
    return false;
  }

  const parsed = new Date(dismissedUntil);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() > referenceDate.getTime();
}

export function shouldShowHomeBackupReminder({
  lastBackupAt,
  dismissedUntil,
  referenceDate = new Date(),
}: {
  lastBackupAt: string | null | undefined;
  dismissedUntil: string | null | undefined;
  referenceDate?: Date;
}): boolean {
  if (isHomeBackupReminderDismissed(dismissedUntil, referenceDate)) {
    return false;
  }

  const ageInDays = getBackupAgeInDays(lastBackupAt, referenceDate);
  return ageInDays === null || ageInDays > REMINDER_THRESHOLD_IN_DAYS;
}

export function writeHomeBackupReminderDismissal(
  referenceDate = new Date(),
  storage?: PreferenceStorage | null
): string {
  const dismissedUntil = new Date(
    referenceDate.getTime() + DISMISS_DURATION_IN_DAYS * DAY_IN_MILLISECONDS
  ).toISOString();

  writeStoredPreference(
    HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY,
    dismissedUntil,
    storage
  );

  return dismissedUntil;
}
