// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { BottomNav } from "../BottomNav";

describe("BottomNav", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
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
  });

  it("renders the five mobile primary destinations with safe touch targets", () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/today"]}>
          <I18nProvider>
            <BottomNav onOpenMenu={() => undefined} />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    expect(container.querySelector("nav.md\\:hidden")).not.toBeNull();
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelector('a[href="/today"]')).not.toBeNull();
    expect(container.querySelector('a[href="/inbox"]')).not.toBeNull();
    expect(container.querySelector('a[href="/calendar"]')).not.toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(4);
    expect(container.querySelector("button")?.textContent).toContain("Menu");
    expect(
      container.querySelector('a[href="/today"]')?.className
    ).toContain("min-h-11");
    expect(
      container.querySelector('a[href="/today"]')?.className
    ).toContain("text-alios-caspian");
  });

  it("opens the existing mobile navigation drawer from the Menu tab", () => {
    const onOpenMenu = vi.fn();

    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <BottomNav onOpenMenu={onOpenMenu} menuOpen />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const menuButton = container.querySelector("button");

    expect(menuButton?.getAttribute("aria-expanded")).toBe("true");
    expect(menuButton?.className).toContain("text-alios-caspian");

    act(() => {
      menuButton?.click();
    });

    expect(onOpenMenu).toHaveBeenCalledTimes(1);
  });
});
