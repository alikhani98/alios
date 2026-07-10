import { useMemo, useState } from "react";

import {
  BackupService,
  createBackupFilename,
  type AliosBackup,
} from "@/core/backup";
import { BACKUP_ERROR_CODES } from "@/core/backup/backupValidation";
import { useStorageAdapter } from "@/core/storage";
import { AppError } from "@/core/errors";
import { useI18n } from "@/shared/i18n";

const LAST_BACKUP_EXPORTED_AT_KEY = "alios.lastBackupExportedAt";
const LAST_RESTORED_AT_KEY = "alios.lastRestoredAt";

function getErrorMessage(
  error: unknown,
  fallback: string,
  messages: {
    invalidJson: string;
    notAlios: string;
    unsupportedVersion: string;
    invalidData: string;
  },
  storageErrorMessage: string
): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case BACKUP_ERROR_CODES.invalidJson:
        return messages.invalidJson;
      case BACKUP_ERROR_CODES.notAlios:
        return messages.notAlios;
      case BACKUP_ERROR_CODES.unsupportedVersion:
        return messages.unsupportedVersion;
      case BACKUP_ERROR_CODES.invalidData:
        return messages.invalidData;
      case "STORAGE_ERROR":
        return storageErrorMessage;
      default:
        return storageErrorMessage;
    }
  }
  return error instanceof Error ? error.message : fallback;
}

function downloadJson(backup: AliosBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = createBackupFilename(new Date(backup.exportedAt));
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function readStoredTimestamp(key: string): string | null {
  return localStorage.getItem(key);
}

export function useBackupRestore(onRestored?: () => Promise<void> | void) {
  const { t } = useI18n();
  const { backup: backupStorage } = useStorageAdapter();
  const service = useMemo(
    () => new BackupService(backupStorage),
    [backupStorage]
  );
  const [pendingBackup, setPendingBackup] = useState<AliosBackup | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);
  const [lastBackupExportedAt, setLastBackupExportedAt] = useState<string | null>(
    () => readStoredTimestamp(LAST_BACKUP_EXPORTED_AT_KEY)
  );
  const [lastRestoredAt, setLastRestoredAt] = useState<string | null>(() =>
    readStoredTimestamp(LAST_RESTORED_AT_KEY)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exportBackup = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const backup = await service.createBackup();
      downloadJson(backup);
      localStorage.setItem(LAST_BACKUP_EXPORTED_AT_KEY, backup.exportedAt);
      setLastBackupExportedAt(backup.exportedAt);
      setSuccess(t("backup.exported"));
    } catch (exportError) {
      setError(
        getErrorMessage(
          exportError,
          t("backup.unexpectedError"),
          {
            invalidJson: t("backup.invalidJson"),
            notAlios: t("backup.notAlios"),
            unsupportedVersion: t("backup.unsupportedVersion"),
            invalidData: t("backup.invalidData"),
          },
          t("backup.storageError")
        )
      );
    } finally {
      setIsExporting(false);
    }
  };

  const selectBackup = async (file: File) => {
    setError(null);
    setSuccess(null);
    setPendingBackup(null);
    setPendingFilename(null);

    try {
      const backup = service.parseBackup(await file.text());
      setPendingBackup(backup);
      setPendingFilename(file.name);
    } catch (validationError) {
      setError(
        getErrorMessage(
          validationError,
          t("backup.unexpectedError"),
          {
            invalidJson: t("backup.invalidJson"),
            notAlios: t("backup.notAlios"),
            unsupportedVersion: t("backup.unsupportedVersion"),
            invalidData: t("backup.invalidData"),
          },
          t("backup.storageError")
        )
      );
    }
  };

  const cancelRestore = () => {
    setPendingBackup(null);
    setPendingFilename(null);
  };

  const confirmRestore = async () => {
    if (!pendingBackup) {
      return;
    }

    setIsRestoring(true);
    setError(null);
    setSuccess(null);

    try {
      await service.restoreBackup(pendingBackup);
      await onRestored?.();
      const restoredAt = new Date().toISOString();
      localStorage.setItem(LAST_RESTORED_AT_KEY, restoredAt);
      setLastRestoredAt(restoredAt);
      setPendingBackup(null);
      setPendingFilename(null);
      setSuccess(t("backup.restored"));
    } catch (restoreError) {
      setError(
        getErrorMessage(
          restoreError,
          t("backup.unexpectedError"),
          {
            invalidJson: t("backup.invalidJson"),
            notAlios: t("backup.notAlios"),
            unsupportedVersion: t("backup.unsupportedVersion"),
            invalidData: t("backup.invalidData"),
          },
          t("backup.restoreFailed")
        )
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return {
    pendingBackup,
    pendingFilename,
    lastBackupExportedAt,
    lastRestoredAt,
    isExporting,
    isRestoring,
    error,
    success,
    exportBackup,
    selectBackup,
    cancelRestore,
    confirmRestore,
  };
}
