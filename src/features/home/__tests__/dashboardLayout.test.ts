import { describe, expect, it } from "vitest";

import {
  getDefaultDashboardLayout,
  getVisibleDashboardSections,
  moveDashboardSectionDown,
  moveDashboardSectionUp,
  normalizeDashboardLayout,
  resetDashboardLayout,
  toggleDashboardSectionVisibility,
  homeDashboardSectionIds,
} from "../dashboardLayout";

describe("home dashboard layout helpers", () => {
  it("includes all known sections in the default layout", () => {
    const layout = getDefaultDashboardLayout();

    expect(layout.orderedSectionIds).toEqual(homeDashboardSectionIds);
    expect(layout.hiddenSectionIds).toEqual([]);
  });

  it("ignores unknown saved ids and preserves the known order", () => {
    const layout = normalizeDashboardLayout({
      orderedSectionIds: ["unknown", "calendar", "hero", "calendar"],
      hiddenSectionIds: ["missing", "hero"],
    });

    expect(layout.orderedSectionIds).toEqual([
      "calendar",
      "hero",
      "emptyState",
      "routineNudge",
      "wellnessBadminton",
      "routineTemplates",
      "upcomingTasks",
      "summaryStats",
      "personalInsights",
      "projectsOverview",
      "journalOverview",
      "knowledgeOverview",
      "manualOverview",
      "quickActions",
    ]);
    expect(layout.hiddenSectionIds).toEqual(["hero"]);
  });

  it("appends new sections safely when the saved layout is missing them", () => {
    const availableSectionIds = [
      "hero",
      "calendar",
      "summaryStats",
      "personalInsights",
      "manualOverview",
    ] as const;

    const layout = normalizeDashboardLayout(
      {
        orderedSectionIds: ["calendar"],
        hiddenSectionIds: [],
      },
      availableSectionIds
    );

    expect(layout.orderedSectionIds).toEqual([
      "calendar",
      "hero",
      "summaryStats",
      "personalInsights",
      "manualOverview",
    ]);
  });

  it("toggles visibility and filters visible sections", () => {
    const hiddenLayout = toggleDashboardSectionVisibility(
      getDefaultDashboardLayout(),
      "calendar"
    );

    expect(hiddenLayout.hiddenSectionIds).toEqual(["calendar"]);
    expect(getVisibleDashboardSections(hiddenLayout)).not.toContain("calendar");

    const visibleLayout = toggleDashboardSectionVisibility(
      hiddenLayout,
      "calendar"
    );

    expect(visibleLayout.hiddenSectionIds).toEqual([]);
    expect(getVisibleDashboardSections(visibleLayout)).toContain("calendar");
  });

  it("moves sections up and down safely", () => {
    const movedUp = moveDashboardSectionUp(
      getDefaultDashboardLayout(),
      "calendar"
    );
    expect(movedUp.orderedSectionIds[5]).toBe("calendar");
    expect(movedUp.orderedSectionIds[6]).toBe("upcomingTasks");

    const movedDown = moveDashboardSectionDown(
      getDefaultDashboardLayout(),
      "calendar"
    );
    expect(movedDown.orderedSectionIds[6]).toBe("summaryStats");
    expect(movedDown.orderedSectionIds[7]).toBe("calendar");
  });

  it("keeps the first and last items fixed when moving past the edges", () => {
    const layout = getDefaultDashboardLayout();

    expect(moveDashboardSectionUp(layout, "hero")).toEqual(layout);
    expect(moveDashboardSectionDown(layout, "quickActions")).toEqual(layout);
  });

  it("resets to the default layout", () => {
    const layout = normalizeDashboardLayout({
      orderedSectionIds: ["calendar", "hero"],
      hiddenSectionIds: ["calendar"],
    });

    expect(resetDashboardLayout()).toEqual(getDefaultDashboardLayout());
    expect(resetDashboardLayout().orderedSectionIds).toEqual(
      homeDashboardSectionIds
    );
    expect(resetDashboardLayout().hiddenSectionIds).toEqual([]);
    expect(layout.hiddenSectionIds).toEqual(["calendar"]);
  });
});
