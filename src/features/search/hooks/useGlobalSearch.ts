import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { SearchLocalDataInput } from "../searchLocalData";
import { mergeLifeAreas } from "@/features/lifeAreas";

export function useGlobalSearch() {
  const { inbox, tasks, projects, goals, lifeAreas, journal, knowledge, manual } = useStorageAdapter();
  const { t } = useI18n();
  const [data, setData] = useState<SearchLocalDataInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadSearchData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const [
        inboxItems,
        taskItems,
        projectItems,
        goalItems,
        lifeAreaItems,
        journalEntries,
        knowledgeItems,
        manualEntries,
      ] =
        await Promise.all([
          inbox.list(),
          tasks.list(),
          projects.list(),
          goals.list(),
          lifeAreas.list(),
          journal.list(),
          knowledge.list(),
          manual.list(),
        ]);

      setData({
        inboxItems,
        tasks: taskItems,
        projects: projectItems,
        goals: goalItems,
        lifeAreas: mergeLifeAreas(lifeAreaItems, t),
        journalEntries,
        knowledgeItems,
        manualEntries,
      });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [goals, inbox, journal, knowledge, lifeAreas, manual, projects, t, tasks]);

  useEffect(() => {
    void loadSearchData();
  }, [loadSearchData]);

  return {
    data,
    isLoading,
    hasError,
    reload: loadSearchData,
  };
}
