// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import { useViewDensityMode, VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { ViewDensityModeControl } from "../pages/SettingsPage";

function DensityHarness() {
  const { value, setValue, persistenceFailed } = useViewDensityMode();
  return <><output>{value}</output><button onClick={() => setValue("simple")}>Simple</button>{persistenceFailed ? <p role="alert">Save failed</p> : null}</>;
}

describe("Density persistence feedback", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalLocalStorage: PropertyDescriptor | undefined;
  beforeEach(async () => {
    await loadMessages("en");
    await loadMessages("fa");
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
    if (originalLocalStorage) Object.defineProperty(window, "localStorage", originalLocalStorage);
    else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(content: ReactNode) {
    await act(async () => root.render(content));
  }
  async function click(label: string) {
    const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
    if (!button) throw new Error(`Button not found: ${label}`);
    await act(async () => button.click());
  }
  function failWrite(key: string) {
    const original = localStorage.setItem.bind(localStorage);
    return vi.spyOn(localStorage, "setItem").mockImplementation((entry, value) => {
      if (entry === key) throw new Error("private storage detail");
      original(entry, value);
    });
  }

  it("updates multiple same-tab subscribers, handles external storage events, and reloads the saved mode", async () => {
    await render(<><DensityHarness /><DensityHarness /></>);
    await click("Simple");
    expect([...container.querySelectorAll("output")].map((node) => node.textContent)).toEqual(["simple", "simple"]);
    localStorage.removeItem(VIEW_DENSITY_MODE_STORAGE_KEY);
    await act(async () => window.dispatchEvent(new StorageEvent("storage", {
      key: VIEW_DENSITY_MODE_STORAGE_KEY, oldValue: "simple", newValue: null,
    })));
    expect([...container.querySelectorAll("output")].map((node) => node.textContent)).toEqual(["full", "full"]);
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");
    await act(async () => window.dispatchEvent(new StorageEvent("storage", {
      key: VIEW_DENSITY_MODE_STORAGE_KEY, oldValue: null, newValue: "simple",
    })));
    expect([...container.querySelectorAll("output")].map((node) => node.textContent)).toEqual(["simple", "simple"]);
    await render(null);
    await render(<DensityHarness />);
    expect(container.querySelector("output")?.textContent).toBe("simple");
  });

  it.each(["en", "fa"] as const)("reports failed save and reset in the existing density control, then retries (%s)", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "fa" ? messagesFa : messagesEn;
    await render(<I18nProvider><ViewDensityModeControl /><DensityHarness /></I18nProvider>);
    const selected = () => container.querySelector<HTMLInputElement>('input[name="viewDensityMode"]:checked')?.value;
    const simple = container.querySelector<HTMLInputElement>('input[name="viewDensityMode"][value="simple"]');
    if (!simple) throw new Error("Missing density radio");
    const failure = failWrite(VIEW_DENSITY_MODE_STORAGE_KEY);
    await act(async () => simple.click());
    expect(selected()).toBe("full");
    expect(container.querySelector("output")?.textContent).toBe("full");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.localPersistenceError"]);
    failure.mockRestore();
    await act(async () => simple.click());
    expect(selected()).toBe("simple");
    expect(container.querySelector("output")?.textContent).toBe("simple");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    const originalRemove = localStorage.removeItem.bind(localStorage);
    const removalFailure = vi.spyOn(localStorage, "removeItem").mockImplementation((key) => {
      if (key === VIEW_DENSITY_MODE_STORAGE_KEY) throw new Error("storage blocked");
      originalRemove(key);
    });
    await click(language === "fa" ? "بازنشانی به نمای کامل" : "Reset to Full View");
    expect(selected()).toBe("simple");
    expect(container.querySelector("output")?.textContent).toBe("simple");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.localPersistenceError"]);
    expect(container.textContent).not.toContain("storage blocked");
    removalFailure.mockRestore();
    await click(language === "fa" ? "بازنشانی به نمای کامل" : "Reset to Full View");
    expect(selected()).toBe("full");
    expect(container.querySelector("output")?.textContent).toBe("full");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
  });

  it("notifies density subscribers only after a successful write", async () => {
    await render(<DensityHarness />);
    const changed = vi.fn((event: Event) => {
      if (event instanceof CustomEvent && event.detail?.key === VIEW_DENSITY_MODE_STORAGE_KEY) return event.detail.key;
      return undefined;
    });
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, changed);
    try {
      const failure = failWrite(VIEW_DENSITY_MODE_STORAGE_KEY);
      await click("Simple");
      expect(changed).not.toHaveBeenCalled();
      expect(container.querySelector("output")?.textContent).toBe("full");
      failure.mockRestore();
      await click("Simple");
      expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
      expect(container.querySelector("output")?.textContent).toBe("simple");
      expect(changed).toHaveBeenCalledTimes(1);
      expect(changed.mock.results[0]?.value).toBe(VIEW_DENSITY_MODE_STORAGE_KEY);
    } finally {
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, changed);
    }
  });

});
