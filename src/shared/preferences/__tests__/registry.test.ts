import { describe, expect, it } from "vitest";

import {
  getPreferencesByCategory,
  PREFERENCE_REGISTRY,
} from "../registry";

describe("preference registry", () => {
  it("classifies every known preference key exactly once", () => {
    const keys = PREFERENCE_REGISTRY.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps every category populated for future sync planning", () => {
    expect(getPreferencesByCategory("account-synced").length).toBeGreaterThan(0);
    expect(getPreferencesByCategory("device-local").length).toBeGreaterThan(0);
    expect(getPreferencesByCategory("intentionally-unsynced").length).toBeGreaterThan(0);
  });
});
