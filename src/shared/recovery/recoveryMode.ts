import { RECOVERY_MODE_ENABLED_STORAGE_KEY } from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  removeStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences";

export { RECOVERY_MODE_ENABLED_STORAGE_KEY } from "@/shared/constants/preferences";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type LocationLike = Pick<Location, "hash" | "search">;

function getStorage(): StorageLike | null {
  return getPreferenceStorage();
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
      return writeStoredPreference(
        RECOVERY_MODE_ENABLED_STORAGE_KEY,
        "true",
        storage
      );
    }

    return removeStoredPreference(RECOVERY_MODE_ENABLED_STORAGE_KEY, storage);
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
