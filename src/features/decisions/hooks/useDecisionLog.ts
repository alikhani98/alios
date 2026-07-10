import { useCallback, useEffect, useState } from "react";

import type {
  CreateDecisionLogEntryInput,
  UpdateDecisionLogEntryInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { DecisionLogEntry } from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useDecisionLog() {
  const { decisions } = useStorageAdapter();
  const [entries, setEntries] = useState<DecisionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setEntries(await decisions.list());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [decisions]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const createDecision = useCallback(
    async (input: CreateDecisionLogEntryInput) => {
      setError(null);
      const entry = await decisions.create(input);
      setEntries((current) => [...current, entry]);
      return entry;
    },
    [decisions]
  );

  const updateDecision = useCallback(
    async (id: string, input: UpdateDecisionLogEntryInput) => {
      setError(null);
      const entry = await decisions.update(id, input);
      setEntries((current) =>
        current.map((item) => (item.id === id ? entry : item))
      );
      return entry;
    },
    [decisions]
  );

  const deleteDecision = useCallback(
    async (id: string) => {
      setError(null);
      await decisions.delete(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    },
    [decisions]
  );

  return {
    entries,
    isLoading,
    error,
    loadEntries,
    createDecision,
    updateDecision,
    deleteDecision,
  };
}
