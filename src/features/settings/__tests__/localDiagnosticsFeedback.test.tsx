// @vitest-environment jsdom
import { act, StrictMode, type SetStateAction } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { LOCAL_ERROR_LOG_STORAGE_KEY, appendRecentLocalError } from "@/shared/error";
import { I18nProvider, LANGUAGE_STORAGE_KEY, useI18n } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { LocalErrorLogSection } from "../components/LocalErrorLogSection";

// React 18 silently ignores updates after unmount. Observe setter calls so the
// lifecycle regressions cannot pass merely because React ignores those updates.
const lifecycle = vi.hoisted(() => ({ observe: false, lateUpdates: 0 }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState<S>(initialState: S | (() => S)) {
      const [value, setValue] = actual.useState(initialState);
      const trackedSetter = actual.useCallback((next: SetStateAction<S>) => {
        if (lifecycle.observe) lifecycle.lateUpdates += 1;
        setValue(next);
      }, [setValue]);
      return [value, trackedSetter];
    },
  };
});

function LanguageControl() {
  const { setLanguage } = useI18n();
  return <button onClick={() => setLanguage("fa")}>Switch language</button>;
}

// Storage and clipboard are controlled test doubles, not real browser permissions.
describe("local diagnostics feedback", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalLocalStorage: PropertyDescriptor | undefined;
  beforeEach(async () => {
    lifecycle.observe = false;
    lifecycle.lateUpdates = 0;
    await loadMessages("en");
    await loadMessages("fa");
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    lifecycle.observe = false;
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
    vi.unstubAllGlobals();
    if (originalLocalStorage) Object.defineProperty(window, "localStorage", originalLocalStorage);
    else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(strict = false) {
    const content = <I18nProvider><DateDisplayProvider><LanguageControl /><LocalErrorLogSection /></DateDisplayProvider></I18nProvider>;
    await act(async () => root.render(strict ? <StrictMode>{content}</StrictMode> : content));
  }
  async function click(label: string) {
    const button = [...container.querySelectorAll("button")].find((entry) => entry.textContent?.trim() === label);
    if (!button) throw new Error(`Missing button: ${label}`);
    await act(async () => button.click());
  }
  it.each(["en", "fa"] as const)("distinguishes read failure from an empty log in %s and retries", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "en" ? messagesEn : messagesFa;
    const original = window.localStorage.getItem.bind(window.localStorage);
    const failure = vi.spyOn(window.localStorage, "getItem").mockImplementation((key) => {
      if (key === LOCAL_ERROR_LOG_STORAGE_KEY) throw new Error("private storage detail");
      return original(key);
    });
    await render();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.errorLogReadFailed"]);
    expect(container.textContent).not.toContain(messages["settings.noLocalErrorsYet"]);
    expect(container.textContent).not.toContain("private storage detail");
    failure.mockRestore();
    await click(messages["common.retry"]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain(messages["settings.noLocalErrorsYet"]);
  });
  it.each(["not-json", "{}", '[{"id":"broken"}]'])("does not present corrupt log data %s as an empty result", async (raw) => {
    localStorage.setItem(LOCAL_ERROR_LOG_STORAGE_KEY, raw);
    await render();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.errorLogReadFailed"]);
    expect(container.textContent).not.toContain(messagesEn["settings.noLocalErrorsYet"]);
    expect(localStorage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toBe(raw);
  });
  it("retains displayed and stored entries after failed clear, then retries", async () => {
    appendRecentLocalError({ message: "Example failure" });
    await render();
    const failure = vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => { throw new Error("private clear detail"); });
    await click(messagesEn["settings.clearLocalErrorLog"]);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.errorLogClearFailed"]);
    expect(container.textContent).toContain("Example failure");
    expect(localStorage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toContain("Example failure");
    expect(container.textContent).not.toContain(messagesEn["settings.noLocalErrorsYet"]);
    failure.mockRestore();
    await click(messagesEn["settings.clearLocalErrorLog"]);
    expect(localStorage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain(messagesEn["settings.noLocalErrorsYet"]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  it.each(["en", "fa"] as const)("distinguishes unsupported copy, rejected copy and successful copy in %s", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "en" ? messagesEn : messagesFa;
    appendRecentLocalError({ message: "Example failure" });
    vi.stubGlobal("navigator", {});
    await render();
    await click(messages["settings.copyError"]);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.errorCopyUnsupported"]);
    const copy = vi.fn().mockRejectedValueOnce(new Error("private clipboard detail")).mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: copy } });
    await click(messages["settings.copyError"]);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.errorCopyFailed"]);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.textContent).not.toContain("private clipboard detail");
    await click(messages["settings.copyError"]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messages["settings.errorCopied"]);
    expect(copy).toHaveBeenLastCalledWith(expect.stringContaining("Message: Example failure"));
  });
  it("serializes clipboard requests and prevents clearing a pending copy", async () => {
    appendRecentLocalError({ message: "Example failure" });
    let resolve!: () => void;
    const copy = vi.fn(() => new Promise<void>((complete) => { resolve = complete; }));
    vi.stubGlobal("navigator", { clipboard: { writeText: copy } });
    await render();
    const buttons = [...container.querySelectorAll("button")];
    const copyButton = buttons.find((entry) => entry.textContent?.trim() === messagesEn["settings.copyError"])!;
    const clearButton = buttons.find((entry) => entry.textContent?.trim() === messagesEn["settings.clearLocalErrorLog"])!;
    await act(async () => { copyButton.click(); copyButton.click(); clearButton.click(); });
    expect(copy).toHaveBeenCalledTimes(1);
    expect(clearButton.disabled).toBe(true);
    expect(localStorage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toContain("Example failure");
    await act(async () => resolve());
    expect(copyButton.disabled).toBe(false);
    expect(clearButton.disabled).toBe(false);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.errorCopied"]);
  });

  it.each(["en", "fa"] as const)("shows unavailable storage in %s and retries without deleting data", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    appendRecentLocalError({ message: "Retained entry" });
    await act(async () => root.render(<I18nProvider><DateDisplayProvider><LanguageControl /></DateDisplayProvider></I18nProvider>));
    const storage = localStorage;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("private getter detail"); } });
    await render();
    const messages = language === "en" ? messagesEn : messagesFa;
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.errorLogUnavailable"]);
    expect(container.textContent).not.toContain("private getter detail");
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    await click(messages["common.retry"]);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("Retained entry");
  });

  it.each(["unsupported", "rejected", "clear"] as const)("translates visible %s feedback when the language changes", async (failure) => {
    appendRecentLocalError({ message: "Example failure" });
    vi.stubGlobal("navigator", failure === "rejected"
      ? { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("private detail")) } }
      : {});
    await render();
    if (failure === "clear") vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => { throw new Error("private detail"); });
    await click(messagesEn[failure === "clear" ? "settings.clearLocalErrorLog" : "settings.copyError"]);
    const key = failure === "clear" ? "settings.errorLogClearFailed" : failure === "rejected" ? "settings.errorCopyFailed" : "settings.errorCopyUnsupported";
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn[key]);
    await click("Switch language");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesFa[key]);
    expect(container.textContent).not.toContain(messagesEn[key]);
  });

  it.each(["resolve", "reject"] as const)("settles a pending %s in the current language and allows another action", async (outcome) => {
    appendRecentLocalError({ message: "Example failure" });
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    const copy = vi.fn().mockImplementationOnce(() => new Promise<void>((ok, fail) => { resolve = ok; reject = fail; })).mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: copy } });
    await render(true);
    await click(messagesEn["settings.copyError"]);
    await click("Switch language");
    await act(async () => { if (outcome === "resolve") resolve(); else reject(new Error("private detail")); });
    expect(container.querySelector(outcome === "resolve" ? '[role="status"]' : '[role="alert"]')?.textContent)
      .toBe(messagesFa[outcome === "resolve" ? "settings.errorCopied" : "settings.errorCopyFailed"]);
    expect([...container.querySelectorAll("button")].every((button) => !button.disabled)).toBe(true);
    await click(messagesFa[outcome === "resolve" ? "settings.errorCopied" : "settings.copyError"]);
    expect(copy).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await click(messagesFa["settings.clearLocalErrorLog"]);
    expect(localStorage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY)).toBeNull();
  });

  it.each(["resolve", "reject"] as const)("does not update state when clipboard %ss after unmount", async (outcome) => {
    appendRecentLocalError({ message: "Example failure" });
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    const copy = vi.fn().mockImplementationOnce(() => new Promise<void>((ok, fail) => { resolve = ok; reject = fail; })).mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: copy } });
    await render(true);
    await click(messagesEn["settings.copyError"]);
    await act(async () => root.render(null));
    lifecycle.observe = true;
    await act(async () => { if (outcome === "resolve") resolve(); else reject(new Error("private detail")); });
    lifecycle.observe = false;
    expect(lifecycle.lateUpdates).toBe(0);
    expect(container.textContent).toBe("");
    await render(true);
    await click(messagesEn["settings.copyError"]);
    expect(copy).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.errorCopied"]);
  });

  it("cleans up the existing copied-feedback timer on unmount", async () => {
    appendRecentLocalError({ message: "Example failure" });
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    vi.useFakeTimers();
    try {
      await render(true);
      await click(messagesEn["settings.copyError"]);
      expect(vi.getTimerCount()).toBe(1);
      await act(async () => root.render(null));
      expect(vi.getTimerCount()).toBe(0);
      lifecycle.observe = true;
      await act(async () => vi.advanceTimersByTime(1500));
      lifecycle.observe = false;
      expect(lifecycle.lateUpdates).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

});
