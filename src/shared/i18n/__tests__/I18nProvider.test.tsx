// @vitest-environment jsdom
import { act, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "../types";
import { I18nProvider } from "../I18nProvider";
import { useI18n } from "../useI18n";
import { LANGUAGE_STORAGE_KEY } from "../i18n";

// Only the loader boundary is controlled. The real provider/context/translation
// and browser preference adapter run unchanged; the destination starts unloaded.
const catalogs = vi.hoisted(() => ({
  loaded: new Set<Language>(), calls: [] as string[],
  prime: async (_language: Language): Promise<void> => {},
  pending: [] as Array<{ language: string; resolve: () => Promise<void>; reject: () => void }>,
}));
vi.mock("../i18n", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../i18n")>();
  catalogs.prime = async (language) => { await actual.loadMessages(language); };
  return {
    ...actual,
    getLoadedMessages: (language: Language) => catalogs.loaded.has(language) ? actual.getLoadedMessages(language) : null,
    loadMessages: (language: Language) => {
      catalogs.calls.push(language);
      if (catalogs.loaded.has(language)) return Promise.resolve(actual.getLoadedMessages(language)!);
      return new Promise<NonNullable<ReturnType<typeof actual.getLoadedMessages>>>((resolve, reject) => {
        catalogs.pending.push({ language,
          resolve: async () => { const messages = await actual.loadMessages(language); catalogs.loaded.add(language); resolve(messages); },
          reject: () => reject(new Error("PRIVATE catalog failure")),
        });
      });
    },
  };
});

function Probe() {
  const { language, direction, setLanguage, t } = useI18n();
  const [draft, setDraft] = useState("draft retained");
  return <section data-language={language} dir={direction}>
    <input aria-label="Draft" value={draft} onChange={event => setDraft(event.target.value)} />
    <span data-testid="translated">{t("settings.copyError")}</span>
    <button onClick={() => setLanguage("en")}>to en</button>
    <button onClick={() => setLanguage("fa")}>to fa</button>
  </section>;
}

describe("I18nProvider catalog activation", () => {
  let container: HTMLDivElement;
  let root: Root;
  let descriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear(); localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    catalogs.loaded.clear(); catalogs.loaded.add("en"); catalogs.calls.length = 0; catalogs.pending.length = 0;
    container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor);
    else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(strict = false) {
    for (const language of catalogs.loaded) await catalogs.prime(language);
    const content = <I18nProvider><Probe /></I18nProvider>;
    await act(async () => root.render(strict ? <StrictMode>{content}</StrictMode> : content));
  }
  async function click(label: string) {
    const button = [...container.querySelectorAll("button")].find(button => button.textContent === label);
    if (!button) throw new Error(`Missing control ${label}`);
    await act(async () => button.click());
  }
  async function settle(language: Language, reject = false) {
    const pending = catalogs.pending.filter(entry => entry.language === language);
    catalogs.pending = catalogs.pending.filter(entry => entry.language !== language);
    expect(pending.length).toBeGreaterThan(0);
    await act(async () => { await Promise.all(pending.map(entry => reject ? entry.reject() : entry.resolve())); });
  }
  function active(language: Language) {
    expect(container.querySelector("section")?.getAttribute("data-language")).toBe(language);
    expect(document.documentElement.lang).toBe(language);
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(language);
    expect(container.querySelector('[data-testid="translated"]')?.textContent).not.toBe("settings.copyError");
  }

  it.each(["en", "fa"] as const)("preserves mounted state for a cold destination from %s", async (initial) => {
    const next = initial === "en" ? "fa" : "en";
    catalogs.loaded.clear(); catalogs.loaded.add(initial); localStorage.setItem(LANGUAGE_STORAGE_KEY, initial);
    await render(); const input = container.querySelector("input")!; input.focus();
    await click(`to ${next}`);
    expect(container.querySelector("input")).toBe(input); expect(input.value).toBe("draft retained"); active(initial);
    expect(document.activeElement).toBe(input);
    await settle(next); expect(container.querySelector("input")).toBe(input); active(next);
    await click(`to ${initial}`); active(initial); expect(container.querySelector("input")).toBe(input);
  });
  it.each(["en", "fa"] as const)("only gates initial startup for an unloaded persisted %s", async (language) => {
    catalogs.loaded.clear(); localStorage.setItem(LANGUAGE_STORAGE_KEY, language); await render();
    expect(container.querySelector("input")).toBeNull(); expect(container.querySelector('[role="status"]')).not.toBeNull();
    await settle(language); active(language); expect(container.querySelector("input")).not.toBeNull();
  });
  it("cancels an obsolete cold transition when the user chooses the active language", async () => {
    await render(); const input = container.querySelector("input"); await click("to fa"); await click("to en");
    await settle("fa"); active("en"); expect(container.querySelector("input")).toBe(input);
  });
  it("only commits the latest request when repeated requests share a destination", async () => {
    await render(); const spy = vi.spyOn(window.localStorage, "setItem");
    await click("to fa"); await click("to en"); await click("to fa"); await settle("fa"); active("fa");
    expect(spy.mock.calls.filter(([key, value]) => key === LANGUAGE_STORAGE_KEY && value === "fa")).toHaveLength(1);
  });
  it("retains the active subtree after rejection and permits an explicit retry", async () => {
    await render(); const input = container.querySelector("input"); await click("to fa"); await settle("fa", true);
    active("en"); expect(container.querySelector("input")).toBe(input);
    expect(container.textContent).not.toContain("PRIVATE catalog failure"); expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).toContain("unsaved edits will be lost");
    expect([...container.querySelectorAll("button")].some(button => button.textContent === "Reload page")).toBe(true);
    await click("Retry"); await settle("fa"); active("fa"); expect(container.querySelector("input")).toBe(input);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  it("recovers from an initial load rejection without displaying raw exceptions", async () => {
    catalogs.loaded.clear(); await render(); await settle("en", true);
    expect(container.querySelector('[role="alert"]')).not.toBeNull(); expect(container.textContent).not.toContain("PRIVATE");
    await click("Retry"); await settle("en"); active("en");
  });
  it("keeps visible and persisted language unchanged when saving fails, then retries", async () => {
    catalogs.loaded.add("fa"); await render(); const original = window.localStorage.setItem.bind(window.localStorage);
    const failure = vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => { if (key === LANGUAGE_STORAGE_KEY) throw new Error("PRIVATE storage"); original(key, value); });
    await click("to fa"); active("en"); expect(container.querySelector('[role="alert"]')).not.toBeNull();
    failure.mockRestore(); await click("Retry"); active("fa");
  });
  it("still renders initial local-only content if preference writes are unavailable", async () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("PRIVATE storage"); });
    await render(); expect(container.querySelector("input")).not.toBeNull();
  });
  it("never persists or activates a request completed after genuine unmount", async () => {
    await render(); await click("to fa"); await act(async () => root.render(null)); const spy = vi.spyOn(window.localStorage, "setItem");
    await settle("fa"); expect(spy).not.toHaveBeenCalled(); expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
  });
  it("ignores stale rejection after a cancellation", async () => {
    await render(); await click("to fa"); await click("to en"); await settle("fa", true); active("en");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  it("is safe under StrictMode initial loading and later transitions", async () => {
    catalogs.loaded.clear(); await render(true); await settle("en"); const input = container.querySelector("input");
    await click("to fa"); await settle("fa"); active("fa"); expect(container.querySelector("input")).toBe(input);
  });
});
