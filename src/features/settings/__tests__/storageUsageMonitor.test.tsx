// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";

import { StorageUsageMonitor } from "../components/StorageUsageMonitor";

let container: HTMLDivElement;
let root: Root;
let originalStorageDescriptor: PropertyDescriptor | undefined;
let originalLocalStorage: PropertyDescriptor | undefined;

function deferredEstimate() {
  let resolve!: (value: StorageEstimate) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<StorageEstimate>((complete, fail) => {
    resolve = complete;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function refreshButton() {
  const button = container.querySelector<HTMLButtonElement>("button");
  if (!button) throw new Error("Missing storage usage refresh button");
  return button;
}

function expectLoading(loading: boolean) {
  expect(refreshButton().disabled).toBe(loading);
  expect(container.querySelector("[aria-busy]")?.getAttribute("aria-busy")).toBe(String(loading));
}

function setStorageEstimateMock(
  estimate: (() => Promise<StorageEstimate>) | undefined
) {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: estimate ? { estimate } : undefined,
  });
}

async function renderMonitor(strict = false) {
  const monitor = <I18nProvider><StorageUsageMonitor /></I18nProvider>;
  await act(async () => {
    root.render(strict ? <StrictMode>{monitor}</StrictMode> : monitor);
  });

  await act(async () => {
    await Promise.resolve();
  });
}

describe("StorageUsageMonitor", () => {
  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    originalStorageDescriptor = Object.getOwnPropertyDescriptor(navigator, "storage");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.restoreAllMocks();

    if (originalStorageDescriptor) {
      Object.defineProperty(navigator, "storage", originalStorageDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "storage");
    }
    if (originalLocalStorage) Object.defineProperty(window, "localStorage", originalLocalStorage);
    else Reflect.deleteProperty(window, "localStorage");
  });

  it("renders usage, quota, percentage, and progress when the Storage Estimate API is available", async () => {
    const estimate = vi.fn().mockResolvedValue({
      usage: 2.5 * 1024 * 1024,
      quota: 10 * 1024 * 1024,
    });
    setStorageEstimateMock(estimate);

    await renderMonitor();

    expect(estimate).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("Storage usage");
    expect(container.textContent).toContain("2.5 MB");
    expect(container.textContent).toContain("10 MB");
    expect(container.textContent).toContain("25% used");
    expect(container.innerHTML).toContain("role=\"progressbar\"");
    expect(container.innerHTML).toContain("aria-valuenow=\"25\"");
    expectLoading(false);
  });

  it("renders a fallback when the Storage Estimate API is not available", async () => {
    setStorageEstimateMock(undefined);

    await renderMonitor();

    expect(container.textContent).toContain(
      "Storage usage information is not available in this browser."
    );
    expect(container.textContent).toContain("Refresh storage usage");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expectLoading(false);
  });

  it.each(["en", "fa"] as const)("localizes rejection and retry without exposing exception details in %s", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "fa" ? messagesFa : messagesEn;
    const retry = deferredEstimate();
    const estimate = vi.fn()
      .mockRejectedValueOnce(new Error("private estimate detail"))
      .mockReturnValueOnce(retry.promise);
    setStorageEstimateMock(estimate);
    await renderMonitor();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.storageUsageError"]);
    expect(container.textContent).not.toContain(messages["settings.storageUsageUnavailable"]);
    expect(container.textContent).not.toContain("private estimate detail");
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
    expectLoading(false);
    await act(async () => refreshButton().click());
    expectLoading(true);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messages["settings.storageUsageLoading"]);
    await act(async () => retry.resolve({ usage: 0, quota: 1024 }));
    expectLoading(false);
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("0");
    expect(estimate).toHaveBeenCalledTimes(2);
  });

  it.each(["resolve", "reject"] as const)("blocks concurrent requests and clears loading after pending requests %s", async (settlement) => {
    const pending = deferredEstimate();
    const estimate = vi.fn().mockResolvedValueOnce({ usage: 1, quota: 4 }).mockReturnValueOnce(pending.promise)
      .mockResolvedValue({ usage: 1, quota: 2 });
    setStorageEstimateMock(estimate);
    await renderMonitor();
    expectLoading(false);
    const refresh = refreshButton();
    await act(async () => {
      // Dispatch before React rerenders, so the synchronous guard is exercised.
      refresh.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      refresh.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(estimate).toHaveBeenCalledTimes(2);
    expectLoading(true);
    await act(async () => refresh.click());
    expect(estimate).toHaveBeenCalledTimes(2);
    await act(async () => {
      if (settlement === "resolve") pending.resolve({ usage: 1, quota: 2 });
      else pending.reject(new Error("private pending failure"));
    });
    expectLoading(false);
    expect(container.querySelector('[role="alert"]') !== null).toBe(settlement === "reject");
    expect(container.textContent).not.toContain("private pending failure");
    await act(async () => refresh.click());
    expect(estimate).toHaveBeenCalledTimes(3);
    expectLoading(false);
  });

  it("keeps the initial request single and usable through StrictMode effect replay", async () => {
    const pending = deferredEstimate();
    const estimate = vi.fn(() => pending.promise);
    setStorageEstimateMock(estimate);
    await renderMonitor(true);
    expectLoading(true);
    expect(estimate).toHaveBeenCalledTimes(1);
    await act(async () => refreshButton().click());
    expect(estimate).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ usage: 1, quota: 4 }));
    expectLoading(false);
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("25");
  });

  it.each(["resolve", "reject"] as const)("discards a request that settles with %s after unmount", async (settlement) => {
    const pending = deferredEstimate();
    const estimate = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue({ usage: 1, quota: 2 });
    const readUsage = vi.fn(() => 3);
    const lateEstimate: StorageEstimate = { get usage() { return readUsage(); }, quota: 4 };
    setStorageEstimateMock(estimate);
    await renderMonitor();
    expectLoading(true);
    await act(async () => root.render(null));
    await act(async () => {
      if (settlement === "resolve") pending.resolve(lateEstimate);
      else pending.reject(new Error("private unmounted failure"));
    });
    // A late success is discarded before reading or formatting its payload.
    expect(readUsage).not.toHaveBeenCalled();
    expect(container.childElementCount).toBe(0);
    await renderMonitor();
    expectLoading(false);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("50");
  });

  it.each([
    {}, { usage: 1 }, { quota: 0 }, { quota: -1 }, { quota: Number.NaN },
    { quota: Number.POSITIVE_INFINITY }, { usage: -1, quota: 1024 },
    { usage: Number.NaN, quota: 1024 }, { usage: Number.POSITIVE_INFINITY, quota: 1024 },
  ])("treats unavailable or invalid estimate values %j as unavailable and permits retry", async (invalid: StorageEstimate) => {
    const estimate = vi.fn().mockResolvedValueOnce(invalid).mockResolvedValue({ usage: 1, quota: 4 });
    setStorageEstimateMock(estimate);
    await renderMonitor();
    expectLoading(false);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.storageUsageUnavailable"]);
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
    await act(async () => refreshButton().click());
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("25");
    expectLoading(false);
  });

  it("preserves the missing-usage fallback and clamps usage above quota to 100 percent", async () => {
    const estimate = vi.fn().mockResolvedValueOnce({ quota: 1024 }).mockResolvedValue({ usage: 2048, quota: 1024 });
    setStorageEstimateMock(estimate);
    await renderMonitor();
    expect(container.textContent).toContain("0 B");
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("0");
    await act(async () => refreshButton().click());
    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("100");
    expect(container.textContent).toContain(messagesEn["settings.storageUsageDanger"]);
    expectLoading(false);
  });
});
