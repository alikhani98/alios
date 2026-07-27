import { BACKUP_STATUS_STORAGE_KEY } from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  removeStoredPreference,
  writeStoredPreference,
} from "./storage";

export const LEGACY_LAST_BACKUP_EXPORTED_AT_KEY =
  "alios.lastBackupExportedAt";

export type BackupStatusFreshness = "never" | "fresh" | "dueSoon" | "overdue";

export type BackupStatusMetadata = {
  lastBackupAt: string | null;
  lastBackupVersion: number | string | null;
  updatedAt: string;
};

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

function isValidBackupVersion(
  value: unknown
): value is BackupStatusMetadata["lastBackupVersion"] {
  return (
    value === null ||
    (typeof value === "number" && Number.isInteger(value)) ||
    (typeof value === "string" && value.trim().length > 0)
  );
}

export function normalizeBackupStatus(
  value: unknown
): BackupStatusMetadata | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate);

  if (
    keys.length !== 3 ||
    !keys.includes("lastBackupAt") ||
    !keys.includes("lastBackupVersion") ||
    !keys.includes("updatedAt")
  ) {
    return null;
  }

  const { lastBackupAt, lastBackupVersion, updatedAt } = candidate;

  if (lastBackupAt !== null && parseBackupDate(String(lastBackupAt)) === null) {
    return null;
  }

  if (!isValidBackupVersion(lastBackupVersion)) {
    return null;
  }

  if (typeof updatedAt !== "string" || parseBackupDate(updatedAt) === null) {
    return null;
  }

  return {
    lastBackupAt: lastBackupAt === null ? null : String(lastBackupAt),
    lastBackupVersion,
    updatedAt,
  };
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
  const storage = getPreferenceStorage();

  if (!storage) {
    return null;
  }

  try {
    const storedStatus = normalizeBackupStatus(
      parseStoredJson(storage.getItem(BACKUP_STATUS_STORAGE_KEY))
    );

    if (storedStatus) {
      return storedStatus;
    }

    const legacyTimestamp = storage.getItem(
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
  const storage = getPreferenceStorage();

  if (!storage) {
    return false;
  }

  try {
    if (status) {
      writeStoredPreference(
        BACKUP_STATUS_STORAGE_KEY,
        JSON.stringify(status),
        storage
      );

      if (status.lastBackupAt) {
        storage.setItem(
          LEGACY_LAST_BACKUP_EXPORTED_AT_KEY,
          status.lastBackupAt
        );
      } else {
        storage.removeItem(LEGACY_LAST_BACKUP_EXPORTED_AT_KEY);
      }
    } else {
      removeStoredPreference(BACKUP_STATUS_STORAGE_KEY, storage);
      storage.removeItem(LEGACY_LAST_BACKUP_EXPORTED_AT_KEY);
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
