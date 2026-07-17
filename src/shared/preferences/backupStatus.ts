import { z } from "zod";

import { BACKUP_STATUS_STORAGE_KEY } from "@/shared/constants/preferences";

export const LEGACY_LAST_BACKUP_EXPORTED_AT_KEY =
  "alios.lastBackupExportedAt";

export type BackupStatusFreshness = "never" | "fresh" | "dueSoon" | "overdue";

export type BackupStatusMetadata = {
  lastBackupAt: string | null;
  lastBackupVersion: number | string | null;
  updatedAt: string;
};

const backupStatusSchema = z
  .object({
    lastBackupAt: z.string().datetime({ offset: true }).nullable(),
    lastBackupVersion: z.union([z.number().int(), z.string().min(1)]).nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseStoredJson(value: string | null): unknown | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parseBackupDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeBackupStatus(
  value: unknown
): BackupStatusMetadata | null {
  const result = backupStatusSchema.safeParse(value);

  if (!result.success) {
    return null;
  }

  return result.data;
}

export function createBackupStatusMetadata(
  lastBackupAt: string | null,
  lastBackupVersion: number | string | null,
  updatedAt = new Date().toISOString()
): BackupStatusMetadata {
  return {
    lastBackupAt,
    lastBackupVersion,
    updatedAt,
  };
}

export function readStoredBackupStatus(): BackupStatusMetadata | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedStatus = normalizeBackupStatus(
      parseStoredJson(window.localStorage.getItem(BACKUP_STATUS_STORAGE_KEY))
    );

    if (storedStatus) {
      return storedStatus;
    }

    const legacyTimestamp = window.localStorage.getItem(
      LEGACY_LAST_BACKUP_EXPORTED_AT_KEY
    );
    const parsedLegacyTimestamp = parseBackupDate(legacyTimestamp);

    if (!parsedLegacyTimestamp) {
      return null;
    }

    const legacyIso = parsedLegacyTimestamp.toISOString();
    return {
      lastBackupAt: legacyIso,
      lastBackupVersion: null,
      updatedAt: legacyIso,
    };
  } catch {
    return null;
  }
}

export function writeStoredBackupStatus(
  status: BackupStatusMetadata | null
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (status) {
      window.localStorage.setItem(
        BACKUP_STATUS_STORAGE_KEY,
        JSON.stringify(status)
      );

      if (status.lastBackupAt) {
        window.localStorage.setItem(
          LEGACY_LAST_BACKUP_EXPORTED_AT_KEY,
          status.lastBackupAt
        );
      } else {
        window.localStorage.removeItem(LEGACY_LAST_BACKUP_EXPORTED_AT_KEY);
      }
    } else {
      window.localStorage.removeItem(BACKUP_STATUS_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_LAST_BACKUP_EXPORTED_AT_KEY);
    }
    return true;
  } catch {
    // Keep the metadata in memory if browser storage is unavailable.
    return false;
  }
}

export function getBackupAgeInDays(
  lastBackupAt: string | null | undefined,
  referenceDate = new Date()
): number | null {
  const backupDate = parseBackupDate(lastBackupAt);

  if (!backupDate) {
    return null;
  }

  const backupDay = getLocalDayStart(backupDate).getTime();
  const referenceDay = getLocalDayStart(referenceDate).getTime();
  return Math.max(0, Math.floor((referenceDay - backupDay) / DAY_IN_MILLISECONDS));
}

export function getBackupFreshness(
  lastBackupAt: string | null | undefined,
  referenceDate = new Date()
): BackupStatusFreshness {
  const ageInDays = getBackupAgeInDays(lastBackupAt, referenceDate);

  if (ageInDays === null) {
    return "never";
  }

  if (ageInDays <= 7) {
    return "fresh";
  }

  if (ageInDays <= 13) {
    return "dueSoon";
  }

  return "overdue";
}
