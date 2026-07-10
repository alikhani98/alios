import { describe, expect, it } from "vitest";

import {
  applyRecoveryModeUrlFlag,
  hasRecoveryModeUrlFlag,
  readRecoveryModeEnabled,
  setRecoveryModeEnabled,
} from "../recoveryMode";

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

describe("recovery mode helpers", () => {
  it("keeps recovery mode disabled until explicitly enabled", () => {
    const storage = new MemoryStorage();

    expect(readRecoveryModeEnabled(storage)).toBe(false);

    expect(setRecoveryModeEnabled(true, storage)).toBe(true);
    expect(readRecoveryModeEnabled(storage)).toBe(true);
    expect(storage.getItem("alios.recoveryMode.enabled")).toBe("true");

    expect(setRecoveryModeEnabled(false, storage)).toBe(true);
    expect(readRecoveryModeEnabled(storage)).toBe(false);
    expect(storage.getItem("alios.recoveryMode.enabled")).toBeNull();
  });

  it("detects recovery flags from search and hash URLs", () => {
    expect(
      hasRecoveryModeUrlFlag({
        search: "?recovery=1",
        hash: "#/settings",
      })
    ).toBe(true);

    expect(
      hasRecoveryModeUrlFlag({
        search: "",
        hash: "#/settings?safe=1",
      })
    ).toBe(true);

    expect(
      hasRecoveryModeUrlFlag({
        search: "",
        hash: "#/settings",
      })
    ).toBe(false);
  });

  it("enables recovery mode from a URL flag without crashing when storage is unavailable", () => {
    expect(
      applyRecoveryModeUrlFlag(
        {
          search: "?safe=1",
          hash: "#/home",
        },
        {
          getItem: () => {
            throw new Error("storage unavailable");
          },
          setItem: () => {
            throw new Error("storage unavailable");
          },
          removeItem: () => {
            throw new Error("storage unavailable");
          },
        }
      )
    ).toBe(false);
  });
});
