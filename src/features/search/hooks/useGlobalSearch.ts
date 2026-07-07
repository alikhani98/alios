import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import type { SearchLocalDataInput } from "../searchLocalData";

export function useGlobalSearch() {
  const { inbox, tasks, projects, journal, knowledge } = useStorageAdapter();
  const [data, setData] = useState<SearchLocalDataInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadSearchData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const [inboxItems, taskItems, projectItems, journalEntries, knowledgeItems] =
        await Promise.all([
          inbox.list(),
          tasks.list(),
          projects.list(),
          journal.list(),
          knowledge.list(),
        ]);

      setData({
        inboxItems,
        tasks: taskItems,
        projects: projectItems,
        journalEntries,
        knowledgeItems,
      });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [inbox, journal, knowledge, projects, tasks]);

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
