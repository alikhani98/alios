import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CreateLifeAreaInput,
  UpdateLifeAreaInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { LifeArea, LifeAreaKey } from "@/shared/types";

import { mergeLifeAreas, type LifeAreaView } from "../lifeAreas";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useLifeAreas() {
  const { lifeAreas } = useStorageAdapter();
  const { t } = useI18n();
  const [persistedAreas, setPersistedAreas] = useState<LifeArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLifeAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setPersistedAreas(await lifeAreas.list());
    } catch (loadError) {
      setError(getErrorMessage(loadError, t("lifeAreas.storageError")));
    } finally {
      setIsLoading(false);
    }
  }, [lifeAreas, t]);

  useEffect(() => {
    void loadLifeAreas();
  }, [loadLifeAreas]);

  const areas = useMemo(
    () => mergeLifeAreas(persistedAreas, t),
    [persistedAreas, t]
  );

  const replacePersistedArea = useCallback((entry: LifeArea) => {
    setPersistedAreas((current) => {
      const next = current.filter((item) => item.areaKey !== entry.areaKey);
      return [...next, entry];
    });
  }, []);

  const upsertArea = useCallback(
    async (input: CreateLifeAreaInput) => {
      setError(null);
      const entry = await lifeAreas.upsert(input);
      replacePersistedArea(entry);
      return entry;
    },
    [lifeAreas, replacePersistedArea]
  );

  const updateArea = useCallback(
    async (areaKey: LifeAreaKey, input: UpdateLifeAreaInput) => {
      setError(null);
      const entry = await lifeAreas.update(areaKey, input);
      replacePersistedArea(entry);
      return entry;
    },
    [lifeAreas, replacePersistedArea]
  );

  const deleteArea = useCallback(
    async (areaKey: LifeAreaKey) => {
      setError(null);
      await lifeAreas.delete(areaKey);
      setPersistedAreas((current) =>
        current.filter((item) => item.areaKey !== areaKey)
      );
    },
    [lifeAreas]
  );

  const markReviewed = useCallback(
    async (areaKey: LifeAreaKey) => {
      setError(null);
      const entry = await lifeAreas.markReviewed(areaKey);
      replacePersistedArea(entry);
      return entry;
    },
    [lifeAreas, replacePersistedArea]
  );

  return {
    areas,
    persistedAreas,
    isLoading,
    error,
    loadLifeAreas,
    upsertArea,
    updateArea,
    deleteArea,
    markReviewed,
  };
}
