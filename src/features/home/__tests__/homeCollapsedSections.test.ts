import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HOME_COLLAPSED_SECTIONS_STORAGE_KEY,
  normalizeHomeCollapsedSectionIds,
  readStoredHomeCollapsedSectionIds,
  writeStoredHomeCollapsedSectionIds,
} from "../homeCollapsedSections";
import { getDefaultHomeCollapsedSectionIds } from "../hooks/useHomeCollapsedSections";

describe("home collapsed section helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes unknown ids away and keeps order stable", () => {
    expect(
      normalizeHomeCollapsedSectionIds([
        "calendar",
        "unknown",
        "calendar",
        "quickActions",
      ])
    ).toEqual(["calendar", "quickActions"]);
  });

  it("returns no stored preference when the stored value is missing or invalid", () => {
    expect(normalizeHomeCollapsedSectionIds("not-an-array")).toEqual([]);
    expect(readStoredHomeCollapsedSectionIds()).toBeNull();
  });

  it("keeps the daily workflow open while secondary sections start collapsed", () => {
    expect(getDefaultHomeCollapsedSectionIds()).toEqual([
      "wellnessBadminton",
      "routineTemplates",
      "calendar",
      "summaryStats",
      "personalInsights",
      "projectsOverview",
      "journalOverview",
      "knowledgeOverview",
      "manualOverview",
      "quickActions",
    ]);
  });

  it("ignores localStorage failures safely", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("storage unavailable");
        },
        removeItem: () => {
          throw new Error("storage unavailable");
        },
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    });

    expect(() =>
      writeStoredHomeCollapsedSectionIds(["calendar", "quickActions"])
    ).not.toThrow();
  });

  it("uses a localStorage-only home collapse key", () => {
    expect(HOME_COLLAPSED_SECTIONS_STORAGE_KEY).toBe(
      "alios.home.collapsedSections"
    );
  });
});
