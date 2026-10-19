// @vitest-environment jsdom
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { getPreferenceStorage } from "@/shared/preferences/storage";
import {
  addQuickAccessItem,
  createQuickAccessItem,
  readQuickAccessPreference,
  writeQuickAccessPreference,
  QUICK_ACCESS_STORAGE_KEY,
} from "@/shared/quickAccess/quickAccess";
import { goalRecord } from "@/test/factories";
import { GoalCard } from "../components/GoalCard";
import { createLifeAreaFocusPath } from "../goalAreaNavigation";

function Location() {
  const location = useLocation();
  return <output>{location.pathname}{location.search}</output>;
}

describe("Goal card overflow disclosure", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onMarkReviewed = vi.fn();
  const onMarkCompleted = vi.fn();
  const onReactivate = vi.fn();

  async function renderCards(overrides: Partial<ComponentProps<typeof GoalCard>> = {}, key = "initial") {
    await act(async () => {
      root.render(
        <MemoryRouter key={key} initialEntries={["/goals"]}>
          <I18nProvider>
            <DateDisplayProvider>
              {["first", "second"].map((id) => (
                <GoalCard
                  key={id}
                  goal={{ ...goalRecord, id }}
                  isReviewDue
                  isDeleting={false}
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                  onMarkReviewed={onMarkReviewed}
                  onMarkCompleted={onMarkCompleted}
                  onReactivate={onReactivate}
                  {...overrides}
                />
              ))}
              <button type="button" data-outside>Outside</button>
              <Location />
            </DateDisplayProvider>
          </I18nProvider>
        </MemoryRouter>
      );
    });
  }

  function trigger(index = 0) {
    const result = container.querySelectorAll<HTMLButtonElement>(".goal-overflow > button")[index];
    if (!result) throw new Error("Missing trigger");
    return result;
  }

  function panel(index = 0) {
    return document.getElementById(trigger(index).getAttribute("aria-controls") ?? "");
  }

  function action(text: string) {
    const result = Array.from(panel()?.querySelectorAll<HTMLButtonElement>("button") ?? [])
      .find((button) => button.textContent?.trim() === text);
    if (!result) throw new Error(`Missing action: ${text}`);
    return result;
  }

  function click(target: HTMLElement) {
    act(() => {
      target.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      target.focus();
      target.click();
    });
  }

  function failPreferenceWrites() {
    // Test setup supplies MemoryStorage, which does not inherit Storage.prototype.
    const storage = getPreferenceStorage();
    if (!storage) throw new Error("Missing test preference storage");
    return vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
  }

  beforeEach(async () => {
    localStorage.clear();
    window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    vi.clearAllMocks();
    const preference = addQuickAccessItem(
      addQuickAccessItem(readQuickAccessPreference(), createQuickAccessItem("project", "unrelated-project")),
      createQuickAccessItem("goal", "unrelated-goal")
    );
    expect(writeQuickAccessPreference(preference)).toBe(true);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await renderCards();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  it("does not mount closed actions, including after remount, regardless of grid CSS", async () => {
    const style = document.createElement("style");
    style.textContent = ".grid { display: grid; }";
    document.head.appendChild(style);
    try {
      expect(panel()).toBeNull();
      expect(trigger().getAttribute("aria-expanded")).toBe("false");
      click(trigger());
      expect(panel()).not.toBeNull();
      await renderCards({}, "reload");
      expect(panel()).toBeNull();
      expect(panel(1)).toBeNull();
    } finally {
      style.remove();
    }
  });

  it("toggles the trigger and focuses the first action on opening", () => {
    click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(panel()?.querySelector("a"));
    click(trigger());
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("dismisses on outside pointer/click, Escape, and keyboard focus leaving the disclosure", () => {
    click(trigger());
    act(() => document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })));
    expect(panel()).toBeNull();
    click(trigger());
    act(() => document.body.click());
    expect(panel()).toBeNull();
    click(trigger());
    act(() => document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    const outside = container.querySelector<HTMLButtonElement>("[data-outside]");
    act(() => outside?.focus());
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it("keeps menus isolated when switching cards", () => {
    click(trigger());
    expect(panel(1)).toBeNull();
    click(trigger(1));
    expect(panel()).toBeNull();
    expect(panel(1)).not.toBeNull();
    expect(trigger().getAttribute("aria-controls")).not.toBe(trigger(1).getAttribute("aria-controls"));
  });

  it("keeps sequential keyboard focus inside the open disclosure until focus leaves", () => {
    click(trigger());
    const actions = panel()?.querySelectorAll<HTMLElement>("a[href], button");
    if (!actions?.length) throw new Error("Missing actions");
    for (const item of actions) {
      act(() => item.focus());
      expect(document.activeElement).toBe(item);
      expect(panel()).not.toBeNull();
      expect(item.tabIndex).toBe(0);
    }
    act(() => trigger().focus());
    expect(panel()).not.toBeNull();
  });

  it.each([
    ["Mark reviewed", onMarkReviewed],
    ["Mark completed", onMarkCompleted],
  ])("executes %s once and restores focus", (label, handler) => {
    click(trigger());
    const button = action(label);
    act(() => { button.click(); button.click(); });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("retains completed-goal reactivation and action eligibility", async () => {
    await renderCards({ goal: { ...goalRecord, status: "completed" } });
    click(trigger());
    expect(panel()?.textContent).not.toContain("Mark reviewed");
    expect(panel()?.textContent).not.toContain("Mark completed");
    click(action("Reactivate"));
    expect(onReactivate).toHaveBeenCalledTimes(1);
    expect(panel()).toBeNull();
    await renderCards({ isReviewDue: false });
    click(trigger());
    expect(panel()?.textContent).not.toContain("Mark reviewed");
  });

  it("preserves the life-area destination and closes on navigation", () => {
    click(trigger());
    const link = panel()?.querySelector("a");
    if (!link) throw new Error("Missing life-area link");
    expect(link.getAttribute("href")).toBe(createLifeAreaFocusPath(goalRecord.area));
    click(link);
    expect(panel()).toBeNull();
    expect(container.querySelector("output")?.textContent).toBe(createLifeAreaFocusPath(goalRecord.area));
  });

  it("adds and removes only the selected Quick Access shortcut and closes each time", () => {
    const before = readQuickAccessPreference();
    click(trigger());
    const add = action("Add to Quick Access");
    act(() => { add.click(); add.click(); });
    expect(readQuickAccessPreference().items.filter((item) => item.id === "goal:first"))
      .toEqual([expect.objectContaining({ id: "goal:first", targetId: "first" })]);
    expect(readQuickAccessPreference().items.filter((item) => item.id !== "goal:first")).toEqual(before.items);
    expect(document.activeElement).toBe(trigger());
    expect(panel()).toBeNull();
    click(trigger());
    click(action("Remove from Quick Access"));
    expect(readQuickAccessPreference()).toEqual(before);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes after a failed Quick Access write without adding a shortcut", () => {
    const before = readQuickAccessPreference();
    click(trigger());
    const failedWrite = failPreferenceWrites();
    click(action("Add to Quick Access"));
    expect(failedWrite).toHaveBeenCalledTimes(1);
    expect(failedWrite).toHaveBeenCalledWith(QUICK_ACCESS_STORAGE_KEY, expect.any(String));
    expect(panel()).toBeNull();
    expect(readQuickAccessPreference()).toEqual(before);
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    expect(action("Add to Quick Access").getAttribute("aria-pressed")).toBe("false");
  });

  it("retains the selected shortcut and all other items when removal cannot be persisted", () => {
    click(trigger());
    click(action("Add to Quick Access"));
    const before = readQuickAccessPreference();
    click(trigger());
    const failedWrite = failPreferenceWrites();
    click(action("Remove from Quick Access"));
    expect(failedWrite).toHaveBeenCalledTimes(1);
    expect(failedWrite).toHaveBeenCalledWith(QUICK_ACCESS_STORAGE_KEY, expect.any(String));
    expect(readQuickAccessPreference()).toEqual(before);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    expect(action("Remove from Quick Access").getAttribute("aria-pressed")).toBe("true");
  });

  it.each(["en", "fa"])("retains disclosure focus and dismissal in %s across appearance classes", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    for (const appearance of ["light", "dark", "system"]) {
      document.documentElement.classList.toggle("dark", appearance === "dark");
      await renderCards({}, `${language}-${appearance}`);
      expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
      expect(panel()).toBeNull();
      // Native button activation is shared by Enter, Space, and pointer input.
      act(() => { trigger().focus(); trigger().click(); });
      expect(document.activeElement).toBe(panel()?.querySelector("a"));
      act(() => document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    }
  });
});
