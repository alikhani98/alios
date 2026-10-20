// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HOME_DASHBOARD_LAYOUT_STORAGE_KEY, homeDashboardSectionIds } from "../dashboardLayout";
import { useHomeDashboardLayout } from "../hooks/useHomeDashboardLayout";

function LayoutControls() {
  const { layout, toggleSectionVisibility, moveSectionUp, resetLayout } =
    useHomeDashboardLayout();

  return (
    <div>
      <output data-testid="layout">{JSON.stringify(layout)}</output>
      <button type="button" onClick={() => toggleSectionVisibility("todayTasks")}>Toggle tasks</button>
      <button type="button" onClick={() => moveSectionUp("todayTasks")}>Move tasks</button>
      <button type="button" onClick={resetLayout}>Reset</button>
    </div>
  );
}

describe("useHomeDashboardLayout persistence", () => {
  let container: HTMLDivElement;
  let root: Root;

  function mount() {
    root = createRoot(container);
    act(() => root.render(<LayoutControls />));
  }

  function readLayout() {
    return JSON.parse(container.querySelector('[data-testid="layout"]')?.textContent ?? "null");
  }

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it("restores visibility and order after remount, then resets storage", () => {
    mount();
    expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBeNull();
    act(() => container.querySelector<HTMLButtonElement>("button:nth-of-type(2)")?.click());
    expect(readLayout().orderedSectionIds[2]).toBe("todayTasks");
    act(() => container.querySelector<HTMLButtonElement>("button:nth-of-type(1)")?.click());

    expect(readLayout().hiddenSectionIds).toEqual(["todayTasks"]);
    expect(readLayout().orderedSectionIds[2]).toBe("todayTasks");
    const storedLayout = JSON.parse(
      localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY) ?? "null"
    );
    expect(storedLayout).toEqual(readLayout());

    act(() => root.unmount());
    mount();
    expect(readLayout().hiddenSectionIds).toEqual(["todayTasks"]);
    expect(readLayout().orderedSectionIds[2]).toBe("todayTasks");

    act(() => container.querySelector<HTMLButtonElement>("button:nth-of-type(3)")?.click());
    expect(readLayout().orderedSectionIds).toEqual(homeDashboardSectionIds);
    expect(readLayout().hiddenSectionIds).toEqual([]);
    expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBeNull();
  });

  it("accepts Finance in an existing saved layout without rewriting the preference on mount", () => {
    const legacyIds = homeDashboardSectionIds.filter((id) => id !== "financeOverview").reverse();
    const stored = JSON.stringify({ orderedSectionIds: legacyIds, hiddenSectionIds: ["summaryStats"] });
    localStorage.setItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY, stored);
    mount();
    expect(readLayout().orderedSectionIds).toEqual([...legacyIds, "financeOverview"]);
    expect(readLayout().hiddenSectionIds).toEqual(["summaryStats"]);
    expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBe(stored);
  });

  it("keeps canonical order when the only hidden section cannot move within its group", () => {
    mount();
    act(() => container.querySelector<HTMLButtonElement>("button:nth-of-type(1)")?.click());
    act(() => container.querySelector<HTMLButtonElement>("button:nth-of-type(2)")?.click());

    expect(readLayout().orderedSectionIds).toEqual(homeDashboardSectionIds);
    expect(readLayout().hiddenSectionIds).toEqual(["todayTasks"]);
    expect(JSON.parse(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY) ?? "null"))
      .toEqual(readLayout());
  });

  it("recovers from malformed saved JSON", () => {
    localStorage.setItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY, "{broken");
    mount();
    expect(readLayout().orderedSectionIds).toEqual(homeDashboardSectionIds);
    expect(readLayout().hiddenSectionIds).toEqual([]);
  });
});
