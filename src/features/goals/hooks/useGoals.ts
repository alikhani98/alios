import { useCallback, useEffect, useState } from "react";

import type {
  CreateGoalInput,
  UpdateGoalInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { Goal } from "@/shared/types";

export function useGoals() {
  const { goals } = useStorageAdapter();
  const { t } = useI18n();
  const [entries, setEntries] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setEntries(await goals.list());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("goals.storageError"));
    } finally {
      setIsLoading(false);
    }
  }, [goals, t]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const createGoal = useCallback(
    async (input: CreateGoalInput) => {
      setError(null);
      const entry = await goals.create(input);
      setEntries((current) => [entry, ...current]);
      return entry;
    },
    [goals]
  );

  const updateGoal = useCallback(
    async (id: string, input: UpdateGoalInput) => {
      setError(null);
      const entry = await goals.update(id, input);
      setEntries((current) => current.map((item) => (item.id === id ? entry : item)));
      return entry;
    },
    [goals]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setError(null);
      await goals.delete(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    },
    [goals]
  );

  return {
    entries,
    isLoading,
    error,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    markGoalReviewed: goals.markReviewed.bind(goals),
    updateGoalProgress: goals.updateProgress.bind(goals),
    markGoalCompleted: goals.markCompleted.bind(goals),
    reactivateGoal: goals.reactivate.bind(goals),
  };
}
