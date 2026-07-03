import { useCallback, useEffect, useState } from "react";

import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { JournalEntry } from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useJournalEntries() {
  const { journal: journalRepository } = useStorageAdapter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setEntries(await journalRepository.list());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [journalRepository]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const createEntry = useCallback(
    async (input: CreateJournalEntryInput) => {
      setError(null);
      const entry = await journalRepository.create(input);
      setEntries((current) => [...current, entry]);
      return entry;
    },
    [journalRepository]
  );

  const updateEntry = useCallback(
    async (id: string, input: UpdateJournalEntryInput) => {
      setError(null);
      const entry = await journalRepository.update(id, input);
      setEntries((current) =>
        current.map((item) => (item.id === id ? entry : item))
      );
      return entry;
    },
    [journalRepository]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      setError(null);
      await journalRepository.delete(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    },
    [journalRepository]
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
