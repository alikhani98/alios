// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";

import { HomeDashboardCustomizer } from "../components/HomeDashboardCustomizer";
import {
  getDefaultDashboardLayout,
  homeDashboardSectionIds,
  homeDashboardSections,
  moveDashboardSectionDown,
  moveDashboardSectionTo,
  moveDashboardSectionUp,
  toggleDashboardSectionVisibility,
} from "../dashboardLayout";

function CustomizerHarness() {
  const [layout, setLayout] = useState(getDefaultDashboardLayout);
  return (
    <HomeDashboardCustomizer
      layout={layout}
      onMoveUp={(id) => setLayout((current) => moveDashboardSectionUp(current, id))}
      onMoveDown={(id) => setLayout((current) => moveDashboardSectionDown(current, id))}
      onMoveTo={(id, targetId, placement) =>
        setLayout((current) => moveDashboardSectionTo(current, id, targetId, placement))
      }
      onToggleVisibility={(id) =>
        setLayout((current) => toggleDashboardSectionVisibility(current, id))
      }
    />
  );
}

describe("HomeDashboardCustomizer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await loadMessages("en");
    localStorage.clear();
    window.localStorage.clear();
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<I18nProvider><CustomizerHarness /></I18nProvider>));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it.each(["todayTasks", "financeOverview"] as const)("moves only %s between visible and hidden groups through the eye control", (sectionId) => {
    const ids = (group: "visible" | "hidden") => Array.from(container.querySelectorAll(
      `[data-dashboard-group="${group}"] [data-dashboard-section-id]`
    )).map((row) => row.getAttribute("data-dashboard-section-id"));
    expect(ids("visible")).toEqual(homeDashboardSectionIds);
    expect(ids("hidden")).toEqual([]);
    const section = homeDashboardSections.find((entry) => entry.id === sectionId);
    if (!section) throw new Error("Missing section registration");
    const label = messagesEn[section.titleKey];
    const hide = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.getAttribute("aria-label") === `Hide section: ${label}`);
    expect(hide).toBeDefined();
    act(() => hide?.click());
    expect(ids("visible")).toEqual(homeDashboardSectionIds.filter((id) => id !== sectionId));
    expect(ids("hidden")).toEqual([sectionId]);
    const show = Array.from(container.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.getAttribute("aria-label") === `Show section: ${label}`);
    expect(show).toBeDefined();
    act(() => show?.click());
    expect(ids("visible")).toEqual(homeDashboardSectionIds);
    expect(ids("hidden")).toEqual([]);
  });

  it("moves a focused handle with arrow keys without toggling visibility", () => {
    const handle = container.querySelector<HTMLButtonElement>(
      '[aria-label="Drag to reorder: Today\'s tasks"]'
    );
    expect(handle).not.toBeNull();
    handle?.focus();
    act(() => handle?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })));

    const ids = Array.from(
      container.querySelectorAll('[data-dashboard-group="visible"] [data-dashboard-section-id]')
    ).map((row) => row.getAttribute("data-dashboard-section-id"));
    const originalIndex = homeDashboardSectionIds.indexOf("todayTasks");
    const previousId = homeDashboardSectionIds[originalIndex - 1];
    expect(previousId).toBeDefined();
    expect(ids).toEqual([
      ...homeDashboardSectionIds.slice(0, originalIndex - 1),
      "todayTasks", previousId,
      ...homeDashboardSectionIds.slice(originalIndex + 1),
    ]);
    expect(container.querySelector('[data-dashboard-group="hidden"] [data-dashboard-section-id]'))
      .toBeNull();
    expect(document.activeElement).toBe(handle);
  });
});
