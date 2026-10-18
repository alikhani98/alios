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
  it("uses the canonical Home registry for default order", () => {
    const layout = getDefaultDashboardLayout();

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
    const movedUp = moveDashboardSectionUp(
      getDefaultDashboardLayout(),
      "todayTasks"
    );
    expect(movedUp.orderedSectionIds[2]).toBe("todayTasks");
    expect(movedUp.orderedSectionIds[3]).toBe("summaryStats");

    const movedDown = moveDashboardSectionDown(
      getDefaultDashboardLayout(),
      "todayTasks"
    );
    expect(movedDown.orderedSectionIds[3]).toBe("reminders");
    expect(movedDown.orderedSectionIds[4]).toBe("todayTasks");
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
    expect(moved.orderedSectionIds[1]).toBe("clearStart");
    expect(moved.orderedSectionIds[5]).toBe("tomorrow");
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
    expect(moved.orderedSectionIds[1]).toBe("tomorrow");
    expect(moved.orderedSectionIds[5]).toBe("clearStart");
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
