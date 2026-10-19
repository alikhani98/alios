// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { getPreferenceStorage } from "@/shared/preferences/storage";
import {
  addQuickAccessItem,
  createQuickAccessItem,
  readQuickAccessPreference,
  writeQuickAccessPreference,
  QUICK_ACCESS_STORAGE_KEY,
} from "@/shared/quickAccess/quickAccess";
import { PremiumCard } from "@/shared/ui";
import { routineRecord } from "@/test/factories";
import { RoutineOverflowMenu } from "../components/RoutineOverflowMenu";

describe("Routine card overflow disclosure", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onEdit = vi.fn();

  async function render(language = "en") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await act(async () => {
      root.render(
        <I18nProvider key={language}>
          <section style={{ overflow: "hidden", height: 100 }}>
            {["first", "second"].map((id) => (
              <PremiumCard key={id}>
                <RoutineOverflowMenu routine={{ ...routineRecord, id, title: id }} onEdit={onEdit} />
              </PremiumCard>
            ))}
          </section>
          <button data-outside>Outside</button>
        </I18nProvider>
      );
    });
  }

  function trigger(index = 0) {
    const button = container.querySelectorAll<HTMLButtonElement>("button[aria-controls]")[index];
    if (!button) throw new Error("Missing routine menu trigger");
    return button;
  }

  function panel(index = 0) {
    return document.getElementById(trigger(index).getAttribute("aria-controls") ?? "");
  }

  function action(index = 0) {
    const button = panel()?.querySelectorAll<HTMLButtonElement>("button")[index];
    if (!button) throw new Error("Missing routine action");
    return button;
  }

  function click(element: HTMLElement) {
    act(() => {
      element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      element.focus();
      element.click();
    });
  }

  function key(value: string, shiftKey = false) {
    act(() => document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: value, shiftKey, bubbles: true })));
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
    vi.clearAllMocks();
    const preference = addQuickAccessItem(
      addQuickAccessItem(readQuickAccessPreference(), createQuickAccessItem("project", "unrelated-project")),
      createQuickAccessItem("routine", "unrelated-routine")
    );
    expect(writeQuickAccessPreference(preference)).toBe(true);

    // Geometry is stubbed only to exercise positioning logic, not to prove visibility.
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation((): DOMRectList => {
      const rects = [new DOMRect(100, 100, 44, 44)];
      return { 0: rects[0], length: rects.length, item: (index) => rects[index] ?? null, [Symbol.iterator]: () => rects.values() };
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 100, 44, 44));
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(224);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(112);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await render();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
    window.localStorage.clear();
  });

  it("starts closed, toggles, exposes a unique accessible label, and focuses the first action", () => {
    expect(panel()).toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-label")).toContain("first");
    click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(panel()?.getAttribute("aria-labelledby")).toBe(trigger().id);
    expect(document.activeElement).toBe(action());
    expect(panel()?.textContent).toContain("Edit");
    expect(panel()?.textContent).toContain("Add to Quick Access");
    click(trigger());
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("portals outside clipping ancestors and uses viewport positioning", () => {
    click(trigger());
    expect(panel()?.parentElement).toBe(document.body);
    expect(container.contains(panel())).toBe(false);
    expect(panel()?.className).toContain("fixed");
    expect(panel()?.style.top).toBe("152px");
    expect(panel()?.style.left).toBe("8px");
    expect(panel()?.style.maxHeight).not.toBe("0px");
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(new DOMRect(100, window.innerHeight - 60, 44, 44));
    act(() => document.dispatchEvent(new Event("scroll")));
    expect(panel()?.style.top).toBe(`${window.innerHeight - 180}px`);
  });

  it("dismisses with Escape, outside pointer, click, and focus without stealing outside focus", () => {
    click(trigger());
    key("Escape");
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    act(() => document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })));
    expect(panel()).toBeNull();
    click(trigger());
    act(() => document.body.click());
    expect(panel()).toBeNull();
    click(trigger());
    const outside = container.querySelector<HTMLButtonElement>("[data-outside]");
    act(() => outside?.focus());
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it("keeps multiple routine menus isolated", () => {
    click(trigger());
    expect(panel(1)).toBeNull();
    click(trigger(1));
    expect(panel()).toBeNull();
    expect(panel(1)).not.toBeNull();
    expect(trigger().getAttribute("aria-controls")).not.toBe(trigger(1).getAttribute("aria-controls"));
  });

  it("edits the selected routine once and closes with focus restored", () => {
    click(trigger());
    const edit = action();
    act(() => { edit.click(); edit.click(); });
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "first" }));
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("retains Quick Access add/remove semantics and closes after each action", () => {
    const before = readQuickAccessPreference();
    click(trigger());
    const add = action(1);
    act(() => { add.click(); add.click(); });
    expect(readQuickAccessPreference().items.filter((item) => item.id === "routine:first"))
      .toEqual([expect.objectContaining({ id: "routine:first", targetId: "first" })]);
    expect(readQuickAccessPreference().items.filter((item) => item.id !== "routine:first")).toEqual(before.items);
    expect(document.activeElement).toBe(trigger());
    expect(panel()).toBeNull();
    click(trigger());
    expect(action(1).textContent).toContain("Remove from Quick Access");
    click(action(1));
    expect(readQuickAccessPreference()).toEqual(before);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes after a failed Quick Access write", () => {
    const before = readQuickAccessPreference();
    click(trigger());
    const failedWrite = failPreferenceWrites();
    click(action(1));
    expect(failedWrite).toHaveBeenCalledTimes(1);
    expect(failedWrite).toHaveBeenCalledWith(QUICK_ACCESS_STORAGE_KEY, expect.any(String));
    expect(panel()).toBeNull();
    expect(readQuickAccessPreference()).toEqual(before);
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    expect(action(1).getAttribute("aria-pressed")).toBe("false");
  });

  it("retains the selected shortcut and all other items when removal cannot be persisted", () => {
    click(trigger());
    click(action(1));
    const before = readQuickAccessPreference();
    click(trigger());
    const failedWrite = failPreferenceWrites();
    click(action(1));
    expect(failedWrite).toHaveBeenCalledTimes(1);
    expect(failedWrite).toHaveBeenCalledWith(QUICK_ACCESS_STORAGE_KEY, expect.any(String));
    expect(readQuickAccessPreference()).toEqual(before);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    click(trigger());
    expect(action(1).getAttribute("aria-pressed")).toBe("true");
  });

  it("supports arrows, Home/End and sequential Tab navigation", () => {
    click(trigger());
    key("ArrowDown");
    expect(document.activeElement).toBe(action(1));
    key("Home");
    expect(document.activeElement).toBe(action());
    key("End");
    expect(document.activeElement).toBe(action(1));
    key("Tab");
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger(1));
    click(trigger());
    key("Tab", true);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it.each(["en", "fa"])("keeps explicit portal direction and dismissal in %s", async (language) => {
    await render(language);
    click(trigger());
    expect(panel()?.dir).toBe(language === "fa" ? "rtl" : "ltr");
    key("Escape");
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });
});
