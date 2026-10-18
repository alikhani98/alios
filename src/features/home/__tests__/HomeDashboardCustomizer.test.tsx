// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { HomeDashboardCustomizer } from "../components/HomeDashboardCustomizer";
import {
  getDefaultDashboardLayout,
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

  beforeEach(() => {
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

  it("separates visible and hidden rows through the eye control", () => {
    const visible = () => container.querySelector('[data-dashboard-group="visible"]');
    const hidden = () => container.querySelector('[data-dashboard-group="hidden"]');
    expect(visible()?.querySelectorAll("[data-dashboard-section-id]")).toHaveLength(11);
    expect(hidden()?.querySelectorAll("[data-dashboard-section-id]")).toHaveLength(0);

    const hide = container.querySelector<HTMLButtonElement>(
      '[aria-label="Hide section: Today\'s tasks"]'
    );
    act(() => hide?.click());
    expect(visible()?.querySelector('[data-dashboard-section-id="todayTasks"]')).toBeNull();
    expect(hidden()?.querySelector('[data-dashboard-section-id="todayTasks"]')).not.toBeNull();

    const show = container.querySelector<HTMLButtonElement>(
      '[aria-label="Show section: Today\'s tasks"]'
    );
    act(() => show?.click());
    expect(visible()?.querySelector('[data-dashboard-section-id="todayTasks"]')).not.toBeNull();
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
    expect(ids[2]).toBe("todayTasks");
    expect(ids[3]).toBe("summaryStats");
    expect(container.querySelector('[data-dashboard-group="hidden"] [data-dashboard-section-id]'))
      .toBeNull();
    expect(document.activeElement).toBe(handle);
  });
});
