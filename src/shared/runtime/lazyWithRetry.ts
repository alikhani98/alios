import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const LAZY_IMPORT_RELOAD_KEY = "alios.lazyImportReload";
const RELOAD_QUERY_PARAMETER = "alios-reload";

type LocationLike = Pick<Location, "pathname" | "search" | "hash" | "replace">;
type SessionStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function getCanonicalRoute(location: Pick<LocationLike, "pathname" | "search" | "hash">): string {
  const search = new URLSearchParams(location.search);
  search.delete(RELOAD_QUERY_PARAMETER);
  const normalizedSearch = search.toString();

  return `${location.pathname}${normalizedSearch ? `?${normalizedSearch}` : ""}${location.hash}`;
}

function getReloadUrl(location: Pick<LocationLike, "pathname" | "search" | "hash">): string {
  const search = new URLSearchParams(location.search);
  search.set(RELOAD_QUERY_PARAMETER, String(Date.now()));

  return `${location.pathname}?${search.toString()}${location.hash}`;
}

export function isDynamicImportFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /(error loading dynamically imported module|failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk .* failed)/i.test(
    error.message
  );
}

export function reloadForDynamicImportFailure(
  error: unknown,
  environment: {
    location: LocationLike;
    sessionStorage: SessionStorageLike;
  } | null = (() => {
    const currentWindow = getWindow();

    if (!currentWindow) {
      return null;
    }

    try {
      return {
        location: currentWindow.location,
        sessionStorage: currentWindow.sessionStorage,
      };
    } catch {
      return null;
    }
  })()
): boolean {
  if (!environment || !isDynamicImportFailure(error)) {
    return false;
  }

  const route = getCanonicalRoute(environment.location);

  try {
    if (environment.sessionStorage.getItem(LAZY_IMPORT_RELOAD_KEY) === route) {
      return false;
    }

    environment.sessionStorage.setItem(LAZY_IMPORT_RELOAD_KEY, route);
    environment.location.replace(getReloadUrl(environment.location));
    return true;
  } catch {
    return false;
  }
}

export function clearDynamicImportRetry(): void {
  const currentWindow = getWindow();

  if (!currentWindow) {
    return;
  }

  try {
    currentWindow.sessionStorage.removeItem(LAZY_IMPORT_RELOAD_KEY);
  } catch {
    // Keep route rendering available when browser storage is unavailable.
  }
}

export function lazyWithRetry<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy<T>(async () => {
    try {
      const module = await load();
      clearDynamicImportRetry();
      return module;
    } catch (error) {
      reloadForDynamicImportFailure(error);
      throw error;
    }
  });
}
