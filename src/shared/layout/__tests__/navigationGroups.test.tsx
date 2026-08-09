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

const previousNavigationHrefs = [
  "/",
  "/search",
  "/today",
  "/calendar",
  "/routines",
  "/weekly-review",
  "/decisions",
  "/inbox",
  "/projects",
  "/goals",
  "/life-areas",
  "/journal",
  "/manual",
  "/knowledge",
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

  it("keeps every previous navigation destination inside exactly one group", () => {
    const groupedHrefs = navigationGroups.flatMap((group) =>
      group.items.map((item) => item.href)
    );

    expect(new Set(groupedHrefs)).toEqual(new Set(previousNavigationHrefs));
    expect(groupedHrefs).toHaveLength(previousNavigationHrefs.length);
    expect(mainNavigation.map((item) => item.href)).toEqual(groupedHrefs);
  });

  it("keeps direct destinations visible and only opens the default planning group", () => {
    const directGroup = navigationGroups.find((group) => group.id === "direct");
    const planReviewGroup = navigationGroups.find((group) => group.id === "planReview");

    expect(directGroup?.items.map((item) => item.href)).toEqual([
      "/",
      "/inbox",
      "/search",
    ]);
    expect(planReviewGroup?.items.map((item) => item.href)).toContain("/today");

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
    expect(container.querySelector('a[href="/search"]')).not.toBeNull();
    expect(container.querySelector('a[href="/calendar"]')).not.toBeNull();
    expect(container.querySelector('a[href="/goals"]')).toBeNull();
    expect(container.querySelector('a[href="/journal"]')).toBeNull();
    expect(container.querySelector('a[href="/finance"]')).toBeNull();
  });

  it("toggles one group without changing the content of other groups", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <NavigationGroupList />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const directionToggle = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("Direction"));

    expect(directionToggle).toBeDefined();
    expect(directionToggle?.getAttribute("aria-expanded")).toBe("false");

    act(() => {
      directionToggle?.click();
    });

    expect(directionToggle?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('a[href="/goals"]')).not.toBeNull();
    expect(container.querySelector('a[href="/projects"]')).not.toBeNull();
    expect(container.querySelector('a[href="/life-areas"]')).not.toBeNull();
    expect(container.querySelector('a[href="/calendar"]')).not.toBeNull();
    expect(container.querySelector('a[href="/journal"]')).toBeNull();
    expect(container.querySelector('a[href="/finance"]')).toBeNull();
  });
});
