import { useMemo, useState } from "react";

import {
  BackupService,
  createBackupFilename,
  type AliosBackup,
} from "@/core/backup";
import { useStorageAdapter } from "@/core/storage";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected backup error occurred.";
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

export function useBackupRestore() {
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
      setSuccess("Backup exported successfully.");
    } catch (exportError) {
      setError(getErrorMessage(exportError));
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
      setError(getErrorMessage(validationError));
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
      setPendingBackup(null);
      setPendingFilename(null);
      setSuccess("Backup restored successfully. Your local data is now up to date.");
    } catch (restoreError) {
      setError(getErrorMessage(restoreError));
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
