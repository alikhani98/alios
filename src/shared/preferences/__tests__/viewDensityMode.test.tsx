import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_VIEW_DENSITY_MODE,
  VIEW_DENSITY_MODE_STORAGE_KEY,
  parseViewDensityMode,
  readStoredViewDensityMode,
  resetViewDensityModePreference,
  saveViewDensityMode,
} from "../viewDensityMode";

describe("viewDensityMode preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("parses supported values and falls back to full for missing or invalid values", () => {
    expect(parseViewDensityMode("full")).toBe("full");
    expect(parseViewDensityMode("simple")).toBe("simple");
    expect(parseViewDensityMode(null)).toBe(DEFAULT_VIEW_DENSITY_MODE);
    expect(parseViewDensityMode(undefined)).toBe(DEFAULT_VIEW_DENSITY_MODE);
    expect(parseViewDensityMode("compact")).toBe(DEFAULT_VIEW_DENSITY_MODE);
  });

  it("persists simple view and treats full view as the default clear state", () => {
    expect(readStoredViewDensityMode()).toBe("full");

    expect(saveViewDensityMode("simple")).toBe(true);
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
    expect(readStoredViewDensityMode()).toBe("simple");

    expect(saveViewDensityMode("full")).toBe(true);
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(readStoredViewDensityMode()).toBe("full");
  });

  it("resets missing, invalid, and cleared values to full view", () => {
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "dense");
    expect(readStoredViewDensityMode()).toBe("full");

    saveViewDensityMode("simple");
    expect(resetViewDensityModePreference()).toBe(true);

    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(readStoredViewDensityMode()).toBe("full");
  });

  it("falls back to Full View when reading browser storage throws", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    expect(readStoredViewDensityMode()).toBe("full");
  });

  it("reports failed writes and failed resets without replacing the saved value", () => {
    const writeFailure = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    expect(saveViewDensityMode("simple")).toBe(false);
    expect(readStoredViewDensityMode()).toBe("full");
    writeFailure.mockRestore();
    expect(saveViewDensityMode("simple")).toBe(true);
    const resetFailure = vi.spyOn(localStorage, "removeItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    expect(saveViewDensityMode("full")).toBe(false);
    expect(resetViewDensityModePreference()).toBe(false);
    expect(readStoredViewDensityMode()).toBe("simple");
    resetFailure.mockRestore();
    expect(resetViewDensityModePreference()).toBe(true);
    expect(readStoredViewDensityMode()).toBe("full");
  });

  it("keeps hook subscribers wired to same-tab and storage events without requiring a DOM test environment", () => {
    const source = readFileSync(
      join(process.cwd(), "src/shared/preferences/viewDensityMode.ts"),
      "utf8"
    );

    expect(source).toContain("LOCAL_PREFERENCE_CHANGE_EVENT");
    expect(source).toContain("window.addEventListener(\"storage\"");
    const storageSource = readFileSync(join(process.cwd(), "src/shared/preferences/storage.ts"), "utf8");
    expect(storageSource).toContain("window.dispatchEvent");
  });
});
