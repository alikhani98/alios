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
  "/experiments",
  "/patterns",
  "/ifthen",
  "/therapy",
  "/weekly-review",
  "/decisions",
  "/goals",
  "/life-areas",
  "/journal",
  "/knowledge",
  "/resources",
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

  it("keeps executive destinations visible and planning destinations open by default", () => {
    const executiveGroup = navigationGroups.find((group) => group.id === "executive");
    const planningGroup = navigationGroups.find((group) => group.id === "planning");

    expect(executiveGroup?.items.map((item) => item.href)).toEqual([
      "/",
      "/today",
      "/inbox",
      "/focus",
    ]);
    expect(planningGroup).toBeDefined();
    expect(planningGroup?.items.map((item) => item.href)).toContain("/projects");

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
    expect(container.querySelector('a[href="/focus"]')).not.toBeNull();
    expect(container.querySelector('a[href="/projects"]')).not.toBeNull();
    expect(container.querySelector('a[href="/calendar"]')).not.toBeNull();
    expect(container.querySelector('a[href="/goals"]')).not.toBeNull();
    expect(container.querySelector('a[href="/finance"]')).not.toBeNull();
    expect(container.querySelector('a[href="/journal"]')).toBeNull();
    expect(container.querySelector('a[href="/search"]')).toBeNull();
  });

  it("toggles planning destinations without changing executive destinations", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const planningToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("Planning"));

    expect(planningToggle).toBeDefined();
    expect(planningToggle?.getAttribute("aria-expanded")).toBe("true");

    act(() => {
      planningToggle?.click();
    });

    expect(planningToggle?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector('a[href="/goals"]')).toBeNull();
    expect(container.querySelector('a[href="/finance"]')).toBeNull();
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
    expect(container.querySelector('a[href="/focus"]')).not.toBeNull();
  });

  it("restores a collapsible navigation group from localStorage", () => {
    localStorage.setItem(NAVIGATION_GROUPS_STORAGE_KEY, '["reflection"]');

    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const reflectionToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("Reflection"));

    expect(reflectionToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/weekly-review"]')).not.toBeNull();
    expect(container.querySelector('a[href="/journal"]')).not.toBeNull();
  });

  it("auto-expands reflection navigation for direct visits to reflection routes", () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/weekly-review"]}>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const reflectionToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("Reflection"));

    expect(reflectionToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/weekly-review"]')).not.toBeNull();
    expect(localStorage.getItem(NAVIGATION_GROUPS_STORAGE_KEY)).toBe(
      '["planning","reflection"]'
    );
  });
});
