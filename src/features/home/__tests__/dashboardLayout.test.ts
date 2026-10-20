import { describe, expect, it } from "vitest";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";

import {
  getDefaultDashboardLayout,
  getVisibleDashboardSections,
  moveDashboardSectionDown,
  moveDashboardSectionTo,
  moveDashboardSectionUp,
  normalizeDashboardLayout,
  resetDashboardLayout,
  toggleDashboardSectionVisibility,
  homeDashboardSectionIds,
  homeDashboardSections,
} from "../dashboardLayout";

describe("home dashboard layout helpers", () => {
  it("appends Finance to legacy layouts without changing their order or hidden sections", () => {
    const legacyIds = homeDashboardSectionIds.filter((id) => id !== "financeOverview").reverse();
    const normalized = normalizeDashboardLayout({ orderedSectionIds: legacyIds, hiddenSectionIds: ["todayTasks", "summaryStats"] });
    expect(normalized.orderedSectionIds).toEqual([...legacyIds, "financeOverview"]);
    expect(normalized.hiddenSectionIds).toEqual(["todayTasks", "summaryStats"]);
    const hidden = toggleDashboardSectionVisibility(normalized, "financeOverview");
    expect(getVisibleDashboardSections(hidden)).not.toContain("financeOverview");
    const restored = toggleDashboardSectionVisibility(hidden, "financeOverview");
    expect(getVisibleDashboardSections(restored)).toContain("financeOverview");
    const moved = moveDashboardSectionUp(restored, "financeOverview");
    expect(moved.orderedSectionIds).not.toEqual(restored.orderedSectionIds);
    expect(moved.hiddenSectionIds).toEqual(restored.hiddenSectionIds);
    expect(resetDashboardLayout().orderedSectionIds).toEqual(homeDashboardSectionIds);
    expect(resetDashboardLayout().hiddenSectionIds).toEqual([]);
  });

  it("uses the canonical Home registry for default order", () => {
    const layout = getDefaultDashboardLayout();

    expect(homeDashboardSectionIds.filter((id) => id === "financeOverview")).toHaveLength(1);
    expect(new Set(homeDashboardSectionIds).size).toBe(homeDashboardSectionIds.length);
    expect(layout.orderedSectionIds).toEqual(homeDashboardSectionIds);
    expect(homeDashboardSections.map(({ id }) => id)).toEqual(homeDashboardSectionIds);
    expect(homeDashboardSectionIds).not.toContain("hero");
    expect(homeDashboardSectionIds).not.toContain("emptyState");
    expect(homeDashboardSectionIds).not.toContain("calendar");
    expect(layout.hiddenSectionIds).toEqual([]);
  });

  it("has English and Persian titles for every configurable section", () => {
    for (const { titleKey } of homeDashboardSections) {
      expect(messagesEn[titleKey].trim()).not.toBe("");
      expect(messagesFa[titleKey].trim()).not.toBe("");
    }
  });

  it("drops obsolete ids while retaining valid order and visibility", () => {
    const layout = normalizeDashboardLayout({
      orderedSectionIds: ["calendar", "summaryStats", "hero", "quickAccess", "summaryStats"],
      hiddenSectionIds: ["calendar", "summaryStats", "hero"],
    });

    expect(layout.orderedSectionIds).toEqual([
      "summaryStats",
      "quickAccess",
      ...homeDashboardSectionIds.filter((id) => id !== "summaryStats" && id !== "quickAccess"),
    ]);
    expect(layout.hiddenSectionIds).toEqual(["summaryStats"]);
  });

  it("appends new sections safely when the saved layout is missing them", () => {
    const availableSectionIds = [
      "quickAccess",
      "clearStart",
      "summaryStats",
      "todayTasks",
    ] as const;

    const layout = normalizeDashboardLayout(
      {
        orderedSectionIds: ["summaryStats"],
        hiddenSectionIds: [],
      },
      availableSectionIds
    );

    expect(layout.orderedSectionIds).toEqual([
      "summaryStats",
      "quickAccess",
      "clearStart",
      "todayTasks",
    ]);
  });

  it("falls back safely for malformed saved preferences", () => {
    expect(normalizeDashboardLayout(null)).toEqual(getDefaultDashboardLayout());
    expect(normalizeDashboardLayout({ orderedSectionIds: "broken" })).toEqual(
      getDefaultDashboardLayout()
    );
  });

  it("toggles visibility and filters visible sections", () => {
    const hiddenLayout = toggleDashboardSectionVisibility(
      getDefaultDashboardLayout(),
      "todayTasks"
    );

    expect(hiddenLayout.hiddenSectionIds).toEqual(["todayTasks"]);
    expect(getVisibleDashboardSections(hiddenLayout)).not.toContain("todayTasks");

    const visibleLayout = toggleDashboardSectionVisibility(
      hiddenLayout,
      "todayTasks"
    );

    expect(visibleLayout.hiddenSectionIds).toEqual([]);
    expect(getVisibleDashboardSections(visibleLayout)).toContain("todayTasks");
  });

  it("moves sections up and down safely", () => {
    const layout = getDefaultDashboardLayout();
    const original = layout.orderedSectionIds;
    const index = original.indexOf("todayTasks");
    const previousId = original[index - 1];
    const nextId = original[index + 1];
    expect(previousId).toBeDefined();
    expect(nextId).toBeDefined();
    const movedUp = moveDashboardSectionUp(layout, "todayTasks");
    expect(movedUp.orderedSectionIds).toEqual([
      ...original.slice(0, index - 1), "todayTasks", previousId, ...original.slice(index + 1),
    ]);
    const movedDown = moveDashboardSectionDown(layout, "todayTasks");
    expect(movedDown.orderedSectionIds).toEqual([
      ...original.slice(0, index), nextId, "todayTasks", ...original.slice(index + 2),
    ]);
    expect(movedUp.hiddenSectionIds).toEqual(layout.hiddenSectionIds);
    expect(movedDown.hiddenSectionIds).toEqual(layout.hiddenSectionIds);
  });

  it("keeps the first and last items fixed when moving past the edges", () => {
    const layout = getDefaultDashboardLayout();

    expect(moveDashboardSectionUp(layout, "quickAccess")).toEqual(layout);
    expect(moveDashboardSectionDown(layout, "backupReminder")).toEqual(layout);
  });

  it("reorders visible sections without changing hidden positions or visibility", () => {
    const hidden = toggleDashboardSectionVisibility(
      toggleDashboardSectionVisibility(getDefaultDashboardLayout(), "clearStart"),
      "tomorrow"
    );
    const moved = moveDashboardSectionTo(hidden, "todayTasks", "quickAccess", "before");

    expect(getVisibleDashboardSections(moved)[0]).toBe("todayTasks");
    expect(moved.hiddenSectionIds).toEqual(["clearStart", "tomorrow"]);
    for (const id of hidden.hiddenSectionIds) {
      expect(moved.orderedSectionIds.indexOf(id)).toBe(hidden.orderedSectionIds.indexOf(id));
    }
    expect(getVisibleDashboardSections(moved).filter((id) => id !== "todayTasks"))
      .toEqual(getVisibleDashboardSections(hidden).filter((id) => id !== "todayTasks"));
    expect(moveDashboardSectionTo(moved, "todayTasks", "tomorrow", "after")).toEqual(moved);
  });

  it("reorders hidden sections without moving visible content", () => {
    const hidden = toggleDashboardSectionVisibility(
      toggleDashboardSectionVisibility(getDefaultDashboardLayout(), "clearStart"),
      "tomorrow"
    );
    const moved = moveDashboardSectionUp(hidden, "tomorrow");

    expect(getVisibleDashboardSections(moved)).toEqual(getVisibleDashboardSections(hidden));
    expect(moved.hiddenSectionIds).toEqual(hidden.hiddenSectionIds);
    expect(moved.orderedSectionIds.indexOf("tomorrow")).toBe(hidden.orderedSectionIds.indexOf("clearStart"));
    expect(moved.orderedSectionIds.indexOf("clearStart")).toBe(hidden.orderedSectionIds.indexOf("tomorrow"));
    expect(moveDashboardSectionDown(moved, "tomorrow")).toEqual(hidden);
  });

  it("resets to the default layout", () => {
    const layout = normalizeDashboardLayout({
      orderedSectionIds: ["summaryStats", "quickAccess"],
      hiddenSectionIds: ["summaryStats"],
    });

    expect(resetDashboardLayout()).toEqual(getDefaultDashboardLayout());
    expect(resetDashboardLayout().orderedSectionIds).toEqual(
      homeDashboardSectionIds
    );
    expect(resetDashboardLayout().hiddenSectionIds).toEqual([]);
    expect(layout.hiddenSectionIds).toEqual(["summaryStats"]);
  });
});
