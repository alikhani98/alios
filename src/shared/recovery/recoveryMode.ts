import {
  LOCAL_PREFERENCE_CHANGE_EVENT,
  RECOVERY_MODE_ENABLED_STORAGE_KEY,
} from "@/shared/constants";

export { RECOVERY_MODE_ENABLED_STORAGE_KEY } from "@/shared/constants";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type LocationLike = Pick<Location, "hash" | "search">;

function getStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getHashSearch(hash: string): string {
  const searchIndex = hash.indexOf("?");

  if (searchIndex === -1) {
    return "";
  }

  return hash.slice(searchIndex + 1);
}

function isEnabledFlag(value: string | null): boolean {
  return value === "1" || value === "true";
}

function hasRecoveryFlag(search: string): boolean {
  if (!search) {
    return false;
  }

  try {
    const params = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search
    );
    return (
      isEnabledFlag(params.get("recovery")) ||
      isEnabledFlag(params.get("safe"))
    );
  } catch {
    return false;
  }
}

function notifyPreferenceChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  } catch {
    // Keep recovery mode local and quiet if custom events are unavailable.
  }
}

export function readRecoveryModeEnabled(
  storage: StorageLike | null = getStorage()
): boolean {
  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(RECOVERY_MODE_ENABLED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setRecoveryModeEnabled(
  enabled: boolean,
  storage: StorageLike | null = getStorage()
): boolean {
  if (!storage) {
    return false;
  }

  try {
    if (enabled) {
      storage.setItem(RECOVERY_MODE_ENABLED_STORAGE_KEY, "true");
    } else {
      storage.removeItem(RECOVERY_MODE_ENABLED_STORAGE_KEY);
    }

    notifyPreferenceChange();
    return true;
  } catch {
    return false;
  }
}

export function hasRecoveryModeUrlFlag(
  locationLike: LocationLike = typeof window !== "undefined"
    ? window.location
    : { hash: "", search: "" }
): boolean {
  return (
    hasRecoveryFlag(locationLike.search) ||
    hasRecoveryFlag(getHashSearch(locationLike.hash))
  );
}

export function applyRecoveryModeUrlFlag(
  locationLike: LocationLike = typeof window !== "undefined"
    ? window.location
    : { hash: "", search: "" },
  storage: StorageLike | null = getStorage()
): boolean {
  if (!hasRecoveryModeUrlFlag(locationLike)) {
    return false;
  }

  return setRecoveryModeEnabled(true, storage);
}
