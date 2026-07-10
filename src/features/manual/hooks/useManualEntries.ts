import { useCallback, useEffect, useState } from "react";

import type {
  CreateManualEntryInput,
  UpdateManualEntryInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { ManualEntry } from "@/shared/types";

export function useManualEntries() {
  const { manual } = useStorageAdapter();
  const { t } = useI18n();
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setEntries(await manual.list());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t("manual.storageError")
      );
    } finally {
      setIsLoading(false);
    }
  }, [manual, t]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const createEntry = useCallback(
    async (input: CreateManualEntryInput) => {
      setError(null);
      const entry = await manual.create(input);
      setEntries((current) => [entry, ...current]);
      return entry;
    },
    [manual]
  );

  const updateEntry = useCallback(
    async (id: string, input: UpdateManualEntryInput) => {
      setError(null);
      const entry = await manual.update(id, input);
      setEntries((current) =>
        current.map((item) => (item.id === id ? entry : item))
      );
      return entry;
    },
    [manual]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      setError(null);
      await manual.delete(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    },
    [manual]
  );

  return {
    entries,
    isLoading,
    error,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
