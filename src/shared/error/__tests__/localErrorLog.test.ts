import { describe, expect, it } from "vitest";

import {
  appendRecentLocalError,
  clearRecentLocalErrors,
  LOCAL_ERROR_LOG_STORAGE_KEY,
  readRecentLocalErrors,
  readRecentLocalErrorsResult,
} from "../localErrorLog";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}

describe("local error log helpers", () => {
  it("keeps only the 10 most recent entries", () => {
    const storage = new MemoryStorage();

    for (let index = 1; index <= 11; index += 1) {
      appendRecentLocalError({ message: `error-${index}` }, storage);
    }

    const entries = readRecentLocalErrors(storage);

    expect(entries).toHaveLength(10);
    expect(entries[0]?.message).toBe("error-2");
    expect(entries[9]?.message).toBe("error-11");
    expect(storage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toContain("error-11");
  });

  it("clears entries and tolerates unavailable storage", () => {
    const storage = new MemoryStorage();

    appendRecentLocalError({ message: "alpha" }, storage);
    expect(readRecentLocalErrors(storage)).toHaveLength(1);

    clearRecentLocalErrors(storage);
    expect(readRecentLocalErrors(storage)).toHaveLength(0);

    expect(readRecentLocalErrors(null)).toEqual([]);
    expect(() => clearRecentLocalErrors(null)).not.toThrow();
    expect(() => appendRecentLocalError({ message: "beta" }, null)).not.toThrow();
  });
  it("distinguishes unavailable storage and read failure from an empty log", () => {
    const storage = new MemoryStorage();
    expect(readRecentLocalErrorsResult(storage)).toEqual({ status: "ready", entries: [] });
    expect(readRecentLocalErrorsResult(null)).toEqual({ status: "unavailable" });
    const broken = {
      getItem: () => { throw new Error("storage unavailable"); },
      setItem: () => undefined,
      removeItem: () => { throw new Error("storage unavailable"); },
    };
    expect(readRecentLocalErrorsResult(broken)).toEqual({ status: "error" });
    expect(clearRecentLocalErrors(broken)).toBe(false);
    expect(clearRecentLocalErrors(null)).toBe(false);
    expect(clearRecentLocalErrors(storage)).toBe(true);
  });

  it.each(["", "not-json", "null", "{}", '[null]', '[{"id":"broken"}]', '[{"id":"a","message":42,"createdAt":"today"}]'])("reports invalid persisted data without changing it: %s", (raw) => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_ERROR_LOG_STORAGE_KEY, raw);
    expect(readRecentLocalErrorsResult(storage)).toEqual({ status: "error" });
    expect(readRecentLocalErrors(storage)).toEqual([]);
    expect(storage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toBe(raw);
  });

  it("validates the entire stored array while retaining the legacy tolerant read API", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 10; index += 1) appendRecentLocalError({ message: `valid-${index}` }, storage);
    const entries = readRecentLocalErrors(storage);
    expect(readRecentLocalErrorsResult(storage)).toEqual({ status: "ready", entries });
    const raw = JSON.stringify([null, ...entries]);
    storage.setItem(LOCAL_ERROR_LOG_STORAGE_KEY, raw);
    expect(readRecentLocalErrorsResult(storage)).toEqual({ status: "error" });
    expect(readRecentLocalErrors(storage)).toEqual(entries);
    expect(storage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toBe(raw);
  });

  it("bounds valid persisted entries and only clears the error-log key", () => {
    const storage = new MemoryStorage();
    appendRecentLocalError({ message: "Example" }, storage);
    const entry = readRecentLocalErrors(storage)[0]!;
    const entries = Array.from({ length: 12 }, (_, index) => ({ ...entry, id: `entry-${index}` }));
    storage.setItem(LOCAL_ERROR_LOG_STORAGE_KEY, JSON.stringify(entries));
    storage.setItem("unrelated.preference", "preserved");
    expect(readRecentLocalErrorsResult(storage)).toEqual({ status: "ready", entries: entries.slice(-10) });
    expect(clearRecentLocalErrors(storage)).toBe(true);
    expect(readRecentLocalErrorsResult(storage)).toEqual({ status: "ready", entries: [] });
    expect(storage.getItem("unrelated.preference")).toBe("preserved");
  });

});
