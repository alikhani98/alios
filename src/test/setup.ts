import "fake-indexeddb/auto";

import { loadMessages } from "@/shared/i18n/i18n";

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;
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

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: new MemoryStorage(),
});

// Ordinary render tests need ready catalogs. Cold-loading tests explicitly reset
// the module or control its loader; production code must never eagerly load both.
if (process.env.ALIOS_TEST_COLD_CATALOGS !== "true") {
  await Promise.all([loadMessages("en"), loadMessages("fa")]);
}
