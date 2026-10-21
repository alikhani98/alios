// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAdapterProvider } from "@/core/storage";
import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants/preferences";
import { I18nProvider, LANGUAGE_STORAGE_KEY, useI18n } from "@/shared/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { writeStoredPreference } from "@/shared/preferences";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import { WEEKLY_TASK_BUDGET_STORAGE_KEY as budgetKey } from "@/shared/preferences/weeklyTaskBudget";
import { createTestStorage, destroyTestDatabase } from "@/test/database";

import { WeeklyTaskBudgetSection } from "../components/WeeklyTaskBudgetSection";

function LanguageControl() {
  const { setLanguage } = useI18n();
  return <button onClick={() => setLanguage("fa")}>Switch language</button>;
}

describe("weekly task budget persistence feedback", () => {
  let fixture: Awaited<ReturnType<typeof createTestStorage>>;
  let container: HTMLDivElement;
  let root: Root;
  let storageDescriptor: PropertyDescriptor | undefined;
  let memory: Storage;
  let budgetEvents: string[];
  const recordBudgetEvent = (event: Event) => {
    if (event instanceof CustomEvent && event.detail?.key === budgetKey) {
      budgetEvents.push(event.detail.key);
    }
  };

  beforeEach(async () => {
    storageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    memory = localStorage;
    Object.defineProperty(window, "localStorage", { configurable: true, value: memory });
    memory.clear();
    memory.setItem(LANGUAGE_STORAGE_KEY, "en");
    memory.setItem(budgetKey, "8");
    fixture = await createTestStorage();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    budgetEvents = [];
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, recordBudgetEvent);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, recordBudgetEvent);
    vi.restoreAllMocks();
    memory.clear();
    if (storageDescriptor) Object.defineProperty(window, "localStorage", storageDescriptor);
    else Reflect.deleteProperty(window, "localStorage");
    await destroyTestDatabase(fixture.database);
  });

  async function render(children: ReactNode = <WeeklyTaskBudgetSection />) {
    await act(async () => root.render(
      <I18nProvider><StorageAdapterProvider adapter={fixture.storage}>
        <LanguageControl />{children}
      </StorageAdapterProvider></I18nProvider>
    ));
  }
  function input() {
    const node = container.querySelector<HTMLInputElement>("#weekly-task-budget-input");
    if (!node) throw new Error("Missing budget input");
    return node;
  }
  function button(label: string) {
    const node = [...container.querySelectorAll("button")].find((item) => item.textContent === label);
    if (!node) throw new Error(`Missing button: ${label}`);
    return node;
  }
  async function click(label: string) {
    await act(async () => button(label).click());
  }
  async function draft(value = "19") {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input(), value);
      input().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input().value).toBe(value);
  }
  function failMutation(method: "setItem" | "removeItem") {
    if (method === "setItem") {
      const original = memory.setItem.bind(memory);
      return vi.spyOn(memory, "setItem").mockImplementation((key, value) => {
        if (key === budgetKey) throw new Error("private storage detail");
        original(key, value);
      });
    }
    const original = memory.removeItem.bind(memory);
    return vi.spyOn(memory, "removeItem").mockImplementation((key) => {
      if (key === budgetKey) throw new Error("private storage detail");
      original(key);
    });
  }
  function expectFailure(message: string) {
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(message);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.textContent).not.toContain("private storage detail");
    expect(input().value).toBe("19");
    expect(memory.getItem(budgetKey)).toBe("8");
    expect(budgetEvents).toEqual([]);
  }

  it("saves, disables a duplicate save, and clears with one event per successful operation", async () => {
    await render();
    await draft("۱۹");
    await click(messagesEn["settings.wbS"]);
    expect(memory.getItem(budgetKey)).toBe("19");
    expect(input().value).toBe("19");
    expect(button(messagesEn["settings.wbS"]).disabled).toBe(true);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.wbSv"]);
    await click(messagesEn["settings.wbS"]);
    expect(budgetEvents).toEqual([budgetKey]);
    await click(messagesEn["settings.wbC"]);
    expect(memory.getItem(budgetKey)).toBeNull();
    expect(input().value).toBe("");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.wbCl"]);
    expect(button(messagesEn["settings.wbC"]).disabled).toBe(true);
    await click(messagesEn["settings.wbC"]);
    expect(budgetEvents).toEqual([budgetKey, budgetKey]);
  });

  it.each(["en", "fa"] as const)("keeps saved state and draft after failed Save/Clear and allows retries (%s)", async (language) => {
    memory.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "en" ? messagesEn : messagesFa;
    await render();
    await draft();
    const writeFailure = failMutation("setItem");
    await click(messages["settings.wbS"]);
    expectFailure(messages["settings.localPersistenceError"]);
    expect(button(messages["settings.wbS"]).disabled).toBe(false);
    writeFailure.mockRestore();
    const removeFailure = failMutation("removeItem");
    await click(messages["settings.wbC"]);
    expectFailure(messages["settings.localPersistenceError"]);
    removeFailure.mockRestore();
    // The old saved value still disables Save when the draft returns to 8.
    await draft("8");
    expect(button(messages["settings.wbS"]).disabled).toBe(true);
    await draft();
    await click(messages["settings.wbS"]);
    expect(memory.getItem(budgetKey)).toBe("19");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(budgetEvents).toEqual([budgetKey]);
    await draft("20");
    const clearFailure = failMutation("removeItem");
    await click(messages["settings.wbC"]);
    expect(input().value).toBe("20");
    expect(memory.getItem(budgetKey)).toBe("19");
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(budgetEvents).toEqual([budgetKey]);
    clearFailure.mockRestore();
    await click(messages["settings.wbC"]);
    expect(input().value).toBe("");
    expect(memory.getItem(budgetKey)).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(budgetEvents).toEqual([budgetKey, budgetKey]);
  });

  it.each(["settings.wbS", "settings.wbC"] as const)("reports denied storage access for %s without changing state, then retries", async (action) => {
    await render();
    await draft();
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("private storage detail"); } });
    await click(messagesEn[action]);
    expectFailure(messagesEn["settings.localPersistenceError"]);
    Object.defineProperty(window, "localStorage", { configurable: true, value: memory });
    await click(messagesEn[action]);
    expect(memory.getItem(budgetKey)).toBe(action === "settings.wbS" ? "19" : null);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(budgetEvents).toEqual([budgetKey]);
  });

  it.each(["settings.wbS", "settings.wbC"] as const)("retranslates a failed operation (%s) without remounting or converting the failure into success", async (action) => {
    await render();
    await draft();
    failMutation(action === "settings.wbS" ? "setItem" : "removeItem");
    await click(messagesEn[action]);
    const node = input();
    await click("Switch language");
    expect(input()).toBe(node);
    expectFailure(messagesFa["settings.localPersistenceError"]);
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("replaces previous success feedback when the next save fails", async () => {
    await render();
    await draft();
    await click(messagesEn["settings.wbS"]);
    await draft("20");
    failMutation("setItem");
    await click(messagesEn["settings.wbS"]);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.localPersistenceError"]);
    expect(memory.getItem(budgetKey)).toBe("19");
    expect(input().value).toBe("20");
    expect(budgetEvents).toEqual([budgetKey]);
  });

  it.each([APPEARANCE_STORAGE_KEY, ACCENT_COLOR_STORAGE_KEY, VIEW_DENSITY_MODE_STORAGE_KEY])("ignores unrelated %s preference events during a failed draft", async (key) => {
    await render();
    await draft();
    failMutation("setItem");
    await click(messagesEn["settings.wbS"]);
    await act(async () => {
      window.dispatchEvent(new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, { detail: { key } }));
      window.dispatchEvent(new StorageEvent("storage", { key }));
    });
    expectFailure(messagesEn["settings.localPersistenceError"]);
  });

  it("uses the supported same-tab publisher and clears obsolete feedback on a genuine external update", async () => {
    await render();
    await draft();
    const failure = failMutation("setItem");
    await click(messagesEn["settings.wbS"]);
    failure.mockRestore();
    await act(async () => { expect(writeStoredPreference(budgetKey, "12")).toBe(true); });
    expect(input().value).toBe("12");
    expect(button(messagesEn["settings.wbS"]).disabled).toBe(true);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(budgetEvents).toEqual([budgetKey]);
  });

  it("does not erase saved state or the draft when a relevant synchronization read throws", async () => {
    await render();
    await draft();
    const originalRead = memory.getItem.bind(memory);
    const failure = vi.spyOn(memory, "getItem").mockImplementation((key) => {
      if (key === budgetKey) throw new Error("private storage detail");
      return originalRead(key);
    });
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: budgetKey })));
    expect(input().value).toBe("19");
    failure.mockRestore();
    expect(memory.getItem(budgetKey)).toBe("8");
    await draft("8");
    expect(button(messagesEn["settings.wbS"]).disabled).toBe(true);
  });

  it("tolerates an unavailable initial budget read and can save after access recovers", async () => {
    const readFailure = vi.spyOn(memory, "getItem").mockImplementation(() => { throw new Error("private storage detail"); });
    await render();
    expect(input().value).toBe("");
    readFailure.mockRestore();
    await draft();
    // With all initial reads denied, the provider uses its default Persian locale.
    await click(messagesFa["settings.wbS"]);
    expect(memory.getItem(budgetKey)).toBe("19");
  });

  it("synchronizes two mounted subscribers only after persistence succeeds", async () => {
    await render(<><WeeklyTaskBudgetSection /><WeeklyTaskBudgetSection /></>);
    await draft();
    const failure = failMutation("setItem");
    await click(messagesEn["settings.wbS"]);
    const inputs = () => [...container.querySelectorAll<HTMLInputElement>("#weekly-task-budget-input")].map((node) => node.value);
    expect(inputs()).toEqual(["19", "8"]);
    expect(budgetEvents).toEqual([]);
    failure.mockRestore();
    await click(messagesEn["settings.wbS"]);
    expect(inputs()).toEqual(["19", "19"]);
    expect(budgetEvents).toEqual([budgetKey]);
    await click(messagesEn["settings.wbC"]);
    expect(inputs()).toEqual(["", ""]);
    expect(budgetEvents).toEqual([budgetKey, budgetKey]);
  });

  it("reports unavailable storage rather than treating it as a successful clear", async () => {
    await render();
    await draft();
    Object.defineProperty(window, "localStorage", { configurable: true, value: null });
    await click(messagesEn["settings.wbC"]);
    expectFailure(messagesEn["settings.localPersistenceError"]);
    Object.defineProperty(window, "localStorage", { configurable: true, value: memory });
  });

  it("retains successful persistence even if preference notification dispatch is unavailable", async () => {
    await render();
    await draft();
    const dispatch = window.dispatchEvent.bind(window);
    vi.spyOn(window, "dispatchEvent").mockImplementation((event) => {
      if (event.type === LOCAL_PREFERENCE_CHANGE_EVENT) throw new Error("private storage detail");
      return dispatch(event);
    });
    await click(messagesEn["settings.wbS"]);
    expect(memory.getItem(budgetKey)).toBe("19");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.wbSv"]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("preserves slider keyboard editing and accessible feedback without persisting before Save", async () => {
    await render();
    const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
    if (!slider) throw new Error("Missing slider");
    slider.focus();
    await act(async () => slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(document.activeElement).toBe(slider);
    expect(input().value).toBe("9");
    expect(slider.getAttribute("aria-valuenow")).toBe("9");
    expect(input().getAttribute("aria-describedby")).toContain("weekly-task-budget-description");
    expect(memory.getItem(budgetKey)).toBe("8");
    expect(budgetEvents).toEqual([]);
    expect(button(messagesEn["settings.wbS"]).type).toBe("button");
    expect(button(messagesEn["settings.wbC"]).type).toBe("button");
  });
});
