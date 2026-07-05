import { useCallback, useEffect, useState } from "react";

import type { LocalDataSummary } from "@/core/backup";
import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";

export function useLocalDataManagement() {
  const { backup } = useStorageAdapter();
  const { t } = useI18n();
  const [summary, setSummary] = useState<LocalDataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSummary(await backup.getSummary());
    } catch {
      setError(t("settings.dataSummaryError"));
    } finally {
      setIsLoading(false);
    }
  }, [backup, t]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const requestClear = () => {
    setError(null);
    setSuccess(null);
    setIsConfirmingClear(true);
  };

  const cancelClear = () => setIsConfirmingClear(false);

  const confirmClear = async () => {
    setIsClearing(true);
    setError(null);
    setSuccess(null);
    try {
      await backup.clearAll();
      setIsConfirmingClear(false);
      setSummary({
        dailyCheckins: 0,
        tasks: 0,
        projects: 0,
        journalEntries: 0,
        knowledgeItems: 0,
        inboxItems: 0,
        settings: 0,
      });
      setSuccess(t("settings.clearSuccess"));
    } catch {
      setError(t("settings.clearError"));
    } finally {
      setIsClearing(false);
    }
  };

  return {
    summary,
    isLoading,
    isClearing,
    isConfirmingClear,
    error,
    success,
    loadSummary,
    requestClear,
    cancelClear,
    confirmClear,
  };
}
