import { describe, expect, it, vi } from "vitest";

import {
  isDynamicImportFailure,
  reloadForDynamicImportFailure,
} from "../lazyWithRetry";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("lazyWithRetry", () => {
  it("identifies the deployment error produced by stale lazy chunks", () => {
    expect(
      isDynamicImportFailure(
        new Error("error loading dynamically imported module: https://example.test/HomePage-old.js")
      )
    ).toBe(true);
    expect(isDynamicImportFailure(new Error("Ordinary page failure"))).toBe(false);
  });

  it("reloads a stale lazy route once with a cache-busting URL", () => {
    const storage = new MemoryStorage();
    const replace = vi.fn();
    const environment = {
      location: {
        pathname: "/alios/",
        search: "",
        hash: "#/",
        replace,
      },
      sessionStorage: storage,
    };
    const error = new Error("error loading dynamically imported module");

    expect(reloadForDynamicImportFailure(error, environment)).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0]?.[0]).toMatch(/^\/alios\/\?alios-reload=\d+#\/$/);
    expect(reloadForDynamicImportFailure(error, environment)).toBe(false);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("preserves existing query parameters while avoiding a retry loop", () => {
    const storage = new MemoryStorage();
    const replace = vi.fn();
    const environment = {
      location: {
        pathname: "/alios/",
        search: "?mode=demo&alios-reload=older",
        hash: "#/today",
        replace,
      },
      sessionStorage: storage,
    };

    expect(
      reloadForDynamicImportFailure(
        new Error("Failed to fetch dynamically imported module"),
        environment
      )
    ).toBe(true);
    expect(replace.mock.calls[0]?.[0]).toMatch(/^\/alios\/\?mode=demo&alios-reload=\d+#\/today$/);
  });
});
