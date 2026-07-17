import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import {
  createBackupStatusMetadata,
  getBackupFreshness,
  readStoredBackupStatus,
  type BackupStatusFreshness,
  type BackupStatusMetadata,
  writeStoredBackupStatus,
} from "@/shared/preferences";

function readStatus(): BackupStatusMetadata | null {
  return readStoredBackupStatus();
}

export function useBackupStatus() {
  const [status, setStatus] = useState<BackupStatusMetadata | null>(() =>
    readStatus()
  );

  useEffect(() => {
    const syncStatus = () => {
      setStatus(readStatus());
    };

    window.addEventListener("storage", syncStatus);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, syncStatus);

    return () => {
      window.removeEventListener("storage", syncStatus);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, syncStatus);
    };
  }, []);

  const updateStatus = useCallback((nextStatus: BackupStatusMetadata | null) => {
    setStatus(nextStatus);
    const persisted = writeStoredBackupStatus(nextStatus);

    if (persisted && typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
    }
  }, []);

  return {
    status,
    freshness: getBackupFreshness(status?.lastBackupAt),
    setStatus: updateStatus,
    markBackupExported: (
      lastBackupAt: string,
      lastBackupVersion: number | string
    ) => {
      updateStatus(createBackupStatusMetadata(lastBackupAt, lastBackupVersion));
    },
  } as const;
}

export type { BackupStatusFreshness, BackupStatusMetadata };
