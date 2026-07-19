import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

import {
  homeCollapsibleSectionIds,
  readStoredHomeCollapsedSectionIds,
  writeStoredHomeCollapsedSectionIds,
  type HomeCollapsibleSectionId,
} from "../homeCollapsedSections";

export function getDefaultHomeCollapsedSectionIds(): HomeCollapsibleSectionId[] {
  return [
    "wellnessBadminton",
    "routineTemplates",
    "calendar",
    "summaryStats",
    "personalInsights",
    "projectsOverview",
    "journalOverview",
    "knowledgeOverview",
    "manualOverview",
    "quickActions",
  ];
}

function readCollapsedSections(): HomeCollapsibleSectionId[] {
  const storedSectionIds = readStoredHomeCollapsedSectionIds();

  return storedSectionIds ?? getDefaultHomeCollapsedSectionIds();
}

export function useHomeCollapsedSections() {
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<
    HomeCollapsibleSectionId[]
  >(() => readCollapsedSections());

  useEffect(() => {
    const handleSync = () => {
      setCollapsedSectionIds(readCollapsedSections());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, []);

  const updateCollapsedSectionIds = useCallback(
    (
      updater: (
        currentValue: HomeCollapsibleSectionId[]
      ) => HomeCollapsibleSectionId[]
    ) => {
      setCollapsedSectionIds((currentValue) => {
        const nextValue = updater(currentValue).filter(
          (sectionId, index, sectionIds) => sectionIds.indexOf(sectionId) === index
        );

        writeStoredHomeCollapsedSectionIds(nextValue);
        window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
        return nextValue;
      });
    },
    []
  );

  const setSectionOpen = useCallback(
    (sectionId: HomeCollapsibleSectionId, open: boolean) => {
      updateCollapsedSectionIds((currentValue) => {
        if (open) {
          return currentValue.filter((value) => value !== sectionId);
        }

        return currentValue.includes(sectionId)
          ? currentValue
          : [...currentValue, sectionId];
      });
    },
    [updateCollapsedSectionIds]
  );

  const isSectionCollapsed = useCallback(
    (sectionId: HomeCollapsibleSectionId) =>
      collapsedSectionIds.includes(sectionId),
    [collapsedSectionIds]
  );

  const resetCollapsedSections = useCallback(() => {
    const defaultSectionIds = getDefaultHomeCollapsedSectionIds();
    setCollapsedSectionIds(defaultSectionIds);
    writeStoredHomeCollapsedSectionIds(defaultSectionIds);
    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  }, []);

  return {
    collapsedSectionIds,
    isSectionCollapsed,
    setSectionOpen,
    resetCollapsedSections,
    hasCollapsedSections:
      collapsedSectionIds.length > 0 &&
      collapsedSectionIds.length <= homeCollapsibleSectionIds.length,
  } as const;
}
