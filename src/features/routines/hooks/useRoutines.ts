import { useCallback, useEffect, useState } from "react";

import type { CreateRoutineInput, UpdateRoutineInput } from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { Routine } from "@/shared/types";

export function useRoutines() {
  const { routines } = useStorageAdapter();
  const [entries, setEntries] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try { setEntries(await routines.list()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Routine storage failed."); }
    finally { setIsLoading(false); }
  }, [routines]);

  useEffect(() => { void loadRoutines(); }, [loadRoutines]);

  const createRoutine = async (input: CreateRoutineInput) => {
    const entry = await routines.create(input);
    setEntries((current) => [entry, ...current]);
    return entry;
  };
  const updateRoutine = async (id: string, input: UpdateRoutineInput) => {
    const entry = await routines.update(id, input);
    setEntries((current) => current.map((item) => item.id === id ? entry : item));
    return entry;
  };
  const deleteRoutine = async (id: string) => {
    await routines.delete(id);
    setEntries((current) => current.filter((item) => item.id !== id));
  };

  return { entries, isLoading, error, loadRoutines, createRoutine, updateRoutine, deleteRoutine };
}
