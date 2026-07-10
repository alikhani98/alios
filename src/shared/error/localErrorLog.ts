export const LOCAL_ERROR_LOG_STORAGE_KEY = "alios.errorLog.recent";
export const LOCAL_ERROR_LOG_MAX_ENTRIES = 10;
const LOCAL_ERROR_LOG_STACK_PREVIEW_LIMIT = 320;

export type LocalErrorLogEntry = {
  id: string;
  message: string;
  source?: string;
  route?: string;
  hash?: string;
  createdAt: string;
  stackPreview?: string;
};

type LocalErrorLogInput = {
  message?: string;
  source?: string;
  route?: string;
  hash?: string;
  stackPreview?: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

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

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `error-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampText(value: string, limit: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

function normalizeStackPreview(stackPreview: unknown): string | undefined {
  if (typeof stackPreview !== "string") {
    return undefined;
  }

  const normalized = stackPreview
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");

  if (!normalized) {
    return undefined;
  }

  return clampText(normalized, LOCAL_ERROR_LOG_STACK_PREVIEW_LIMIT);
}

function parseErrorEntries(value: string | null): LocalErrorLogEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry): LocalErrorLogEntry | null => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const candidate = entry as Partial<LocalErrorLogEntry>;
        if (
          typeof candidate.id !== "string" ||
          typeof candidate.message !== "string" ||
          typeof candidate.createdAt !== "string"
        ) {
          return null;
        }

        return {
          id: candidate.id,
          message: clampText(candidate.message, 240) || "Unknown error",
          source:
            typeof candidate.source === "string"
              ? clampText(candidate.source, 120)
              : undefined,
          route:
            typeof candidate.route === "string"
              ? clampText(candidate.route, 180)
              : undefined,
          hash:
            typeof candidate.hash === "string"
              ? clampText(candidate.hash, 180)
              : undefined,
          createdAt: candidate.createdAt,
          stackPreview:
            typeof candidate.stackPreview === "string"
              ? clampText(candidate.stackPreview, LOCAL_ERROR_LOG_STACK_PREVIEW_LIMIT)
              : undefined,
        } as LocalErrorLogEntry;
      })
      .filter((entry): entry is LocalErrorLogEntry => entry !== null)
      .slice(-LOCAL_ERROR_LOG_MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeErrorEntries(
  entries: LocalErrorLogEntry[],
  storage: StorageLike | null = getStorage()
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      LOCAL_ERROR_LOG_STORAGE_KEY,
      JSON.stringify(entries.slice(-LOCAL_ERROR_LOG_MAX_ENTRIES))
    );
  } catch {
    // Keep the error boundary calm even when localStorage is unavailable.
  }
}

export function readRecentLocalErrors(
  storage: StorageLike | null = getStorage()
): LocalErrorLogEntry[] {
  if (!storage) {
    return [];
  }

  try {
    return parseErrorEntries(storage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function clearRecentLocalErrors(
  storage: StorageLike | null = getStorage()
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(LOCAL_ERROR_LOG_STORAGE_KEY);
  } catch {
    // No-op when storage is unavailable or locked down.
  }
}

export function createLocalErrorLogEntry(
  input: LocalErrorLogInput
): LocalErrorLogEntry {
  return {
    id: createId(),
    message: clampText(input.message ?? "Unknown error", 240) || "Unknown error",
    source: input.source ? clampText(input.source, 120) : undefined,
    route: input.route ? clampText(input.route, 180) : undefined,
    hash: input.hash ? clampText(input.hash, 180) : undefined,
    createdAt: new Date().toISOString(),
    stackPreview: normalizeStackPreview(input.stackPreview),
  };
}

export function appendRecentLocalError(
  input: LocalErrorLogInput,
  storage: StorageLike | null = getStorage()
): LocalErrorLogEntry[] {
  const nextEntry = createLocalErrorLogEntry(input);
  const existingEntries = readRecentLocalErrors(storage);
  const nextEntries = [...existingEntries, nextEntry].slice(
    -LOCAL_ERROR_LOG_MAX_ENTRIES
  );

  writeErrorEntries(nextEntries, storage);

  return nextEntries;
}

export function formatLocalErrorLogEntry(entry: LocalErrorLogEntry): string {
  return [
    `Message: ${entry.message}`,
    entry.source ? `Source: ${entry.source}` : null,
    entry.route ? `Route: ${entry.route}` : null,
    entry.hash ? `Hash: ${entry.hash}` : null,
    `Created at: ${entry.createdAt}`,
    entry.stackPreview ? `Stack preview: ${entry.stackPreview}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
