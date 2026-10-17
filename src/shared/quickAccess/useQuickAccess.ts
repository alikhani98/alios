import { useCallback, useEffect, useState } from "react";

import { LOCAL_PREFERENCE_CHANGE_EVENT, QUICK_ACCESS_STORAGE_KEY } from "@/shared/constants/preferences";
import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import { resolveQuickAccessItems, type ResolvedQuickAccessItem } from "./resolver";
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
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === QUICK_ACCESS_STORAGE_KEY) sync();
    };
    const onPreferenceChange = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.key === QUICK_ACCESS_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, onPreferenceChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, onPreferenceChange);
    };
  }, []);

  const persist = useCallback((update: (current: QuickAccessPreference) => QuickAccessPreference) => {
    const current = readQuickAccessPreference();
    const normalized = normalizeQuickAccessPreference(update(current));
    const saved = writeQuickAccessPreference(normalized);
    setPreference(saved ? normalized : current);
    return saved;
  }, []);

  return {
    preference,
    add: (itemType: QuickAccessItemType, targetId?: string) =>
      persist((current) => addQuickAccessItem(current, createQuickAccessItem(itemType, targetId))),
    addItem: (item: QuickAccessItem) => persist((current) => addQuickAccessItem(current, item)),
    setEnabled: (id: string, enabled: boolean) =>
      persist((current) => updateQuickAccessItem(current, id, { enabled })),
    remove: (id: string) => persist((current) => removeQuickAccessItem(current, id)),
    move: (id: string, direction: "up" | "down") =>
      persist((current) => moveQuickAccessItem(current, id, direction)),
    reset: () => persist(() => resetQuickAccessPreference()),
  } as const;
}

// Resolve both surfaces through the current adapter; never retain entity titles in preferences.
export function useResolvedQuickAccessItems(items: QuickAccessItem[], enabledOnly = false) {
  const storage = useStorageAdapter();
  const { t } = useI18n();
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  const [result, setResult] = useState<{
    source: QuickAccessItem[];
    storage: typeof storage;
    translate: typeof t;
    revision: number;
    items: ResolvedQuickAccessItem[];
    hasError: boolean;
  } | null>(null);

  useEffect(() => {
    window.addEventListener("focus", retry);
    return () => window.removeEventListener("focus", retry);
  }, [retry]);

  useEffect(() => {
    let active = true;
    setResult(null);
    void resolveQuickAccessItems(enabledOnly ? items.filter((item) => item.enabled) : items, storage, t)
      .then((resolved) => {
        if (active) setResult({ source: items, storage, translate: t, revision, items: resolved, hasError: false });
      })
      .catch(() => {
        if (active) setResult({ source: items, storage, translate: t, revision, items: [], hasError: true });
      });
    return () => { active = false; };
  }, [items, enabledOnly, storage, t, revision]);

  const current = result?.source === items && result.storage === storage &&
    result.translate === t && result.revision === revision ? result : null;
  return { items: current?.items ?? [], isLoading: !current, hasError: current?.hasError ?? false, retry };
}
