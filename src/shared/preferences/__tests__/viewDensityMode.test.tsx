import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

    saveViewDensityMode("simple");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
    expect(readStoredViewDensityMode()).toBe("simple");

    saveViewDensityMode("full");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(readStoredViewDensityMode()).toBe("full");
  });

  it("resets missing, invalid, and cleared values to full view", () => {
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "dense");
    expect(readStoredViewDensityMode()).toBe("full");

    saveViewDensityMode("simple");
    resetViewDensityModePreference();

    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(readStoredViewDensityMode()).toBe("full");
  });

  it("keeps hook subscribers wired to same-tab and storage events without requiring a DOM test environment", () => {
    const source = readFileSync(
      join(process.cwd(), "src/shared/preferences/viewDensityMode.ts"),
      "utf8"
    );

    expect(source).toContain("LOCAL_PREFERENCE_CHANGE_EVENT");
    expect(source).toContain("window.addEventListener(\"storage\"");
    expect(source).toContain("window.dispatchEvent");
  });
});
