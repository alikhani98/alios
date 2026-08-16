// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  NAVIGATION_GROUPS_STORAGE_KEY,
  mainNavigation,
  navigationGroups,
} from "@/shared/constants/navigation";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { NavigationGroupList } from "../NavigationGroupList";

const expectedNavigationHrefs = [
  "/",
  "/today",
  "/inbox",
  "/projects",
  "/calendar",
  "/focus",
  "/search",
  "/routines",
  "/weekly-review",
  "/decisions",
  "/goals",
  "/life-areas",
  "/journal",
  "/knowledge",
  "/manual",
  "/finance",
  "/settings",
] as const;

describe("navigation groups", () => {
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

  it("keeps every navigation destination inside exactly one group", () => {
    const groupedHrefs = navigationGroups.flatMap((group) =>
      group.items.map((item) => item.href)
    );

    expect(new Set(groupedHrefs)).toEqual(new Set(expectedNavigationHrefs));
    expect(groupedHrefs).toHaveLength(expectedNavigationHrefs.length);
    expect(mainNavigation.map((item) => item.href)).toEqual(groupedHrefs);
  });

  it("keeps core destinations visible and advanced destinations collapsed by default", () => {
    const directGroup = navigationGroups.find((group) => group.id === "direct");
    const advancedGroup = navigationGroups.find((group) => group.id === "advanced");

    expect(directGroup?.items.map((item) => item.href)).toEqual([
      "/",
      "/today",
      "/inbox",
      "/projects",
      "/calendar",
      "/focus",
      "/search",
    ]);
    expect(advancedGroup?.items.map((item) => item.href)).toContain("/goals");
    expect(advancedGroup?.items.map((item) => item.href)).toContain("/finance");
    expect(advancedGroup?.items.map((item) => item.href)).toContain("/settings");

    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelector('a[href="/today"]')).not.toBeNull();
    expect(container.querySelector('a[href="/inbox"]')).not.toBeNull();
    expect(container.querySelector('a[href="/projects"]')).not.toBeNull();
    expect(container.querySelector('a[href="/calendar"]')).not.toBeNull();
    expect(container.querySelector('a[href="/focus"]')).not.toBeNull();
    expect(container.querySelector('a[href="/search"]')).not.toBeNull();
    expect(container.querySelector('a[href="/goals"]')).toBeNull();
    expect(container.querySelector('a[href="/journal"]')).toBeNull();
    expect(container.querySelector('a[href="/finance"]')).toBeNull();
  });

  it("toggles advanced destinations without changing core destinations", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const advancedToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("More"));

    expect(advancedToggle).toBeDefined();
    expect(advancedToggle?.getAttribute("aria-expanded")).toBe("false");

    act(() => {
      advancedToggle?.click();
    });

    expect(advancedToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/goals"]')).not.toBeNull();
    expect(container.querySelector('a[href="/life-areas"]')).not.toBeNull();
    expect(container.querySelector('a[href="/journal"]')).not.toBeNull();
    expect(container.querySelector('a[href="/finance"]')).not.toBeNull();
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelector('a[href="/projects"]')).not.toBeNull();
    expect(container.querySelector('a[href="/calendar"]')).not.toBeNull();
  });

  it("restores the advanced navigation group from localStorage", () => {
    localStorage.setItem(NAVIGATION_GROUPS_STORAGE_KEY, '["advanced"]');

    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const advancedToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("More"));

    expect(advancedToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/goals"]')).not.toBeNull();
    expect(container.querySelector('a[href="/settings"]')).not.toBeNull();
  });

  it("auto-expands advanced navigation for direct visits to advanced routes", () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/goals"]}>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const advancedToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("More"));

    expect(advancedToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/goals"]')).not.toBeNull();
    expect(localStorage.getItem(NAVIGATION_GROUPS_STORAGE_KEY)).toBe(
      '["advanced"]'
    );
  });
});
