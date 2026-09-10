import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import {
  addQuickAccessItem,
  createQuickAccessItem,
  moveQuickAccessItem,
  normalizeQuickAccessPreference,
  readQuickAccessPreference,
  removeQuickAccessItem,
  resetQuickAccessPreference,
  updateQuickAccessItem,
  writeQuickAccessPreference,
  type QuickAccessItem,
  type QuickAccessItemType,
  type QuickAccessPreference,
} from "./quickAccess";

export function useQuickAccessPreference() {
  const [preference, setPreference] = useState<QuickAccessPreference>(() =>
    readQuickAccessPreference()
  );

  useEffect(() => {
    const sync = () => setPreference(readQuickAccessPreference());
    window.addEventListener("storage", sync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, sync);
    };
  }, []);

  const persist = useCallback((next: QuickAccessPreference) => {
    const normalized = normalizeQuickAccessPreference(next);
    setPreference(normalized);
    writeQuickAccessPreference(normalized);
  }, []);

  return {
    preference,
    add: (itemType: QuickAccessItemType, targetId?: string) =>
      persist(addQuickAccessItem(preference, createQuickAccessItem(itemType, targetId))),
    addItem: (item: QuickAccessItem) => persist(addQuickAccessItem(preference, item)),
    setEnabled: (id: string, enabled: boolean) =>
      persist(updateQuickAccessItem(preference, id, { enabled })),
    remove: (id: string) => persist(removeQuickAccessItem(preference, id)),
    move: (id: string, direction: "up" | "down") =>
      persist(moveQuickAccessItem(preference, id, direction)),
    reset: () => persist(resetQuickAccessPreference()),
  } as const;
}
