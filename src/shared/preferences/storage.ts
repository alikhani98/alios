import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

export type PreferenceStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type PreferenceParser<TValue> = (
  value: string | null | undefined
) => TValue;

export function getPreferenceStorage(): PreferenceStorage | null {
  const storageHost =
    typeof window === "undefined" ? globalThis : window;

  if (!("localStorage" in storageHost)) {
    return null;
  }

  try {
    return storageHost.localStorage;
  } catch {
    return null;
  }
}

export function notifyPreferenceChanged(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, {
        detail: { key },
      })
    );
  } catch {
    // Keep preference writes local and quiet if custom events are unavailable.
  }
}

export function readStoredPreference<TValue>(
  key: string,
  parse: PreferenceParser<TValue>,
  fallback: TValue,
  storage: PreferenceStorage | null = getPreferenceStorage()
): TValue {
  if (!storage) {
    return fallback;
  }

  try {
    return parse(storage.getItem(key));
  } catch {
    return fallback;
  }
}

export function writeStoredPreference(
  key: string,
  value: string,
  storage: PreferenceStorage | null = getPreferenceStorage()
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    notifyPreferenceChanged(key);
    return true;
  } catch {
    return false;
  }
}

export function removeStoredPreference(
  key: string,
  storage: PreferenceStorage | null = getPreferenceStorage()
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    notifyPreferenceChanged(key);
    return true;
  } catch {
    return false;
  }
}
