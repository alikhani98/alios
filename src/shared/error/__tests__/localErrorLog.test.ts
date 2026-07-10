import { describe, expect, it } from "vitest";

import {
  appendRecentLocalError,
  clearRecentLocalErrors,
  LOCAL_ERROR_LOG_STORAGE_KEY,
  readRecentLocalErrors,
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
});
