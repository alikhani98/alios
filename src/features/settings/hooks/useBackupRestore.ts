import { useMemo, useState } from "react";

import {
  BackupService,
  createBackupFilename,
  type AliosBackup,
} from "@/core/backup";
import { useStorageAdapter } from "@/core/storage";
import { AppError } from "@/core/errors";
import { useI18n } from "@/shared/i18n";

function getErrorMessage(
  error: unknown,
  fallback: string,
  validationMessage: string,
  storageMessage: string
): string {
  if (error instanceof AppError) {
    return error.code === "VALIDATION_ERROR" ? validationMessage : storageMessage;
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
  link.download = createBackupFilename();
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
      setSuccess(t("backup.exported"));
    } catch (exportError) {
      setError(getErrorMessage(exportError, t("backup.unexpectedError"), t("backup.invalid"), t("backup.storageError")));
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
      setError(getErrorMessage(validationError, t("backup.unexpectedError"), t("backup.invalid"), t("backup.storageError")));
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
      setPendingBackup(null);
      setPendingFilename(null);
      setSuccess(t("backup.restored"));
    } catch (restoreError) {
      setError(getErrorMessage(restoreError, t("backup.unexpectedError"), t("backup.invalid"), t("backup.storageError")));
    } finally {
      setIsRestoring(false);
    }
  };

  return {
    pendingBackup,
    pendingFilename,
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
