// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { StorageUsageMonitor } from "../components/StorageUsageMonitor";

let container: HTMLDivElement;
let root: Root;
let originalStorageDescriptor: PropertyDescriptor | undefined;

function setStorageEstimateMock(
  estimate: (() => Promise<StorageEstimate>) | undefined
) {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: estimate ? { estimate } : undefined,
  });
}

async function renderMonitor() {
  await act(async () => {
    root.render(
      <I18nProvider>
        <StorageUsageMonitor />
      </I18nProvider>
    );
  });

  await act(async () => {
    await Promise.resolve();
  });
}

describe("StorageUsageMonitor", () => {
  beforeEach(() => {
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
  });

  it("renders a fallback when the Storage Estimate API is not available", async () => {
    setStorageEstimateMock(undefined);

    await renderMonitor();

    expect(container.textContent).toContain(
      "Storage usage information is not available in this browser."
    );
    expect(container.textContent).toContain("Refresh storage usage");
  });
});
