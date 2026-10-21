// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StorageAdapterProvider } from "@/core/storage";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { I18nProvider, useI18n, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import { WEEKLY_TASK_BUDGET_STORAGE_KEY } from "@/shared/preferences/weeklyTaskBudget";
import { WeeklyTaskBudgetSection } from "../components/WeeklyTaskBudgetSection";

function LanguageControl() {
  const { setLanguage } = useI18n();
  return <button onClick={() => setLanguage("fa")}>Switch language</button>;
}
describe("weekly budget preference event scope", () => {
  let fixture: Awaited<ReturnType<typeof createTestStorage>>;
  let container: HTMLDivElement; let root: Root; let descriptor: PropertyDescriptor | undefined;
  beforeEach(async () => {
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear(); localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "8");
    fixture = await createTestStorage(); container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
    await act(async () => root.render(<I18nProvider><StorageAdapterProvider adapter={fixture.storage}><LanguageControl /><WeeklyTaskBudgetSection /></StorageAdapterProvider></I18nProvider>));
    const input = container.querySelector<HTMLInputElement>("#weekly-task-budget-input")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "19");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input.value).toBe("19");
  });
  afterEach(async () => {
    await act(async () => root.unmount()); container.remove(); await destroyTestDatabase(fixture.database); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor); else Reflect.deleteProperty(window, "localStorage");
  });
  const input = () => container.querySelector<HTMLInputElement>("#weekly-task-budget-input")!;
  it("retains the draft during a real provider language preference write", async () => {
    const node = input();
    await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
    expect(input()).toBe(node); expect(input().value).toBe("19");
    expect(document.documentElement.lang).toBe("fa");
    expect(localStorage.getItem(WEEKLY_TASK_BUDGET_STORAGE_KEY)).toBe("8");
  });
  it.each(["custom", "storage"] as const)("ignores unrelated %s preference events", async (kind) => {
    await act(async () => window.dispatchEvent(kind === "custom"
      ? new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, { detail: { key: LANGUAGE_STORAGE_KEY } })
      : new StorageEvent("storage", { key: LANGUAGE_STORAGE_KEY, newValue: "fa" })));
    expect(input().value).toBe("19");
  });
  it.each(["custom", "storage"] as const)("still synchronizes relevant %s budget changes", async (kind) => {
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "12");
    await act(async () => window.dispatchEvent(kind === "custom"
      ? new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, { detail: { key: WEEKLY_TASK_BUDGET_STORAGE_KEY } })
      : new StorageEvent("storage", { key: WEEKLY_TASK_BUDGET_STORAGE_KEY, newValue: "12" })));
    expect(input().value).toBe("12");
  });
  it("handles an explicit storage clear event and ignores malformed notifications", async () => {
    await act(async () => window.dispatchEvent(new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, { detail: null })));
    expect(input().value).toBe("19");
    localStorage.removeItem(WEEKLY_TASK_BUDGET_STORAGE_KEY);
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect(input().value).toBe("");
  });
});
