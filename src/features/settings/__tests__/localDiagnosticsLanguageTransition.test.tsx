// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, useI18n, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { DateDisplayProvider } from "@/shared/date";
import { appendRecentLocalError, LOCAL_ERROR_LOG_STORAGE_KEY } from "@/shared/error";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import type { Language } from "@/shared/i18n/types";
import { LocalErrorLogSection } from "../components/LocalErrorLogSection";

const catalogs = vi.hoisted(() => ({
  loaded: new Set<Language>(),
  prime: async (_language: Language): Promise<void> => {},
  pending: [] as Array<{ language: Language; resolve: () => Promise<void> }>,
}));
vi.mock("@/shared/i18n/i18n", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/i18n/i18n")>();
  catalogs.prime = async (language) => { await actual.loadMessages(language); };
  return { ...actual,
    getLoadedMessages: (language: Language) => catalogs.loaded.has(language) ? actual.getLoadedMessages(language) : null,
    loadMessages: (language: Language) => {
      if (catalogs.loaded.has(language)) return Promise.resolve(actual.getLoadedMessages(language)!);
      return new Promise<NonNullable<ReturnType<typeof actual.getLoadedMessages>>>(resolve => catalogs.pending.push({ language,
        resolve: async () => { const messages = await actual.loadMessages(language); catalogs.loaded.add(language); resolve(messages); },
      }));
    },
  };
});
function Controls() {
  const { setLanguage } = useI18n();
  return <><button onClick={() => setLanguage("en")}>to en</button><button onClick={() => setLanguage("fa")}>to fa</button></>;
}
describe("Diagnostics with real provider cold transitions", () => {
  let container: HTMLDivElement; let root: Root; let descriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage }); localStorage.clear();
    catalogs.loaded.clear(); catalogs.pending.length = 0;
    container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor); else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(initial: Language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, initial); catalogs.loaded.add(initial);
    await catalogs.prime(initial);
    await act(async () => root.render(<I18nProvider><DateDisplayProvider><Controls /><LocalErrorLogSection id="diagnostics" /></DateDisplayProvider></I18nProvider>));
  }
  async function click(label: string) {
    const button = [...container.querySelectorAll("button")].find(button => button.textContent?.trim() === label);
    if (!button) throw new Error(`Missing ${label}`); await act(async () => button.click());
  }
  async function activate(language: Language) {
    const pending = catalogs.pending.filter(entry => entry.language === language); expect(pending.length).toBeGreaterThan(0);
    catalogs.pending = catalogs.pending.filter(entry => entry.language !== language);
    await act(async () => { await Promise.all(pending.map(entry => entry.resolve())); });
  }
  for (const initial of ["en", "fa"] as const) {
    const destination = initial === "en" ? "fa" : "en";
    const first = initial === "en" ? messagesEn : messagesFa;
    const second = destination === "en" ? messagesEn : messagesFa;
    it.each(["copy", "clear", "read"] as const)(`retains %s feedback for a cold destination from ${initial}`, async (failure) => {
      appendRecentLocalError({ message: "Retained diagnostic" });
      vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("PRIVATE failure")) } });
      if (failure === "read") {
        const get = window.localStorage.getItem.bind(window.localStorage);
        vi.spyOn(window.localStorage, "getItem").mockImplementation(key => { if (key === LOCAL_ERROR_LOG_STORAGE_KEY) throw new Error("PRIVATE read"); return get(key); });
      }
      await render(initial);
      if (failure === "clear") vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => { throw new Error("PRIVATE clear"); });
      if (failure !== "read") await click(first[failure === "copy" ? "settings.copyError" : "settings.clearLocalErrorLog"]);
      const key = failure === "read" ? "settings.errorLogReadFailed" : failure === "clear" ? "settings.errorLogClearFailed" : "settings.errorCopyFailed";
      const card = container.querySelector("#diagnostics");
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(first[key]);
      await click(`to ${destination}`);
      expect(container.querySelector("#diagnostics")).toBe(card); expect(container.querySelector('[role="alert"]')?.textContent).toBe(first[key]);
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(initial);
      await activate(destination);
      expect(container.querySelector("#diagnostics")).toBe(card); expect(container.querySelector('[role="alert"]')?.textContent).toBe(second[key]);
      expect(container.querySelector('[role="status"]')).toBeNull(); expect(container.textContent).not.toContain("PRIVATE");
      await click(`to ${initial}`); expect(container.querySelector("#diagnostics")).toBe(card);
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(first[key]);
    });
    it(`keeps one pending copy through a cold destination from ${initial}`, async () => {
      appendRecentLocalError({ message: "Retained diagnostic" }); let resolve!: () => void;
      const copy = vi.fn(() => new Promise<void>(complete => { resolve = complete; }));
      vi.stubGlobal("navigator", { clipboard: { writeText: copy } }); await render(initial);
      const card = container.querySelector("#diagnostics"); const clear = vi.spyOn(window.localStorage, "removeItem");
      await click(first["settings.copyError"]); await click(`to ${destination}`); await activate(destination);
      expect(container.querySelector("#diagnostics")).toBe(card);
      await click(second["settings.copyError"]); await click(second["settings.clearLocalErrorLog"]);
      expect(copy).toHaveBeenCalledTimes(1); expect(clear).not.toHaveBeenCalled();
      await act(async () => resolve()); expect(container.querySelector('[role="status"]')?.textContent).toBe(second["settings.errorCopied"]);
      expect([...container.querySelectorAll("button")].every(button => !button.disabled)).toBe(true);
    });
  }
});
