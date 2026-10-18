// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAdapterProvider } from "@/core/storage";
import { type AliosDatabase, type DexieStorageAdapter } from "@/db/dexie";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { Topbar } from "@/shared/layout/Topbar";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { QuickAccessLauncher } from "../QuickAccessLauncher";
import { QuickAccessToggleButton } from "../QuickAccessToggleButton";
import { createModuleQuickAccessItem, createQuickAccessItem, readQuickAccessPreference, writeQuickAccessPreference } from "../quickAccess";

function Shell({ overlay = false }: { overlay?: boolean }) {
  const location = useLocation();
  return <><Topbar title="AliOS" onOpenMobileSidebar={() => {}} onOpenCommandPalette={() => {}}
    showDashboardControls={location.pathname === "/"} shellOverlayOpen={overlay} />
    <output data-location>{location.pathname}{location.search}</output></>;
}

describe("global Quick Access", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    localStorage.clear();
    window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    await loadMessages("en");
    writeQuickAccessPreference({ version: 1, items: [] });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    await destroyTestDatabase(database);
  });

  async function render(path = "/today", children?: ReactNode, overlay = false) {
    await act(async () => root.render(<MemoryRouter initialEntries={[path]}>
      <I18nProvider><StorageAdapterProvider adapter={storage}>
        <Shell overlay={overlay} />{children}
      </StorageAdapterProvider></I18nProvider>
    </MemoryRouter>));
  }
  async function until(assertion: () => void) {
    await vi.waitFor(async () => {
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      assertion();
    });
  }
  function button(label: string, scope: ParentNode = container) {
    const found = Array.from(scope.querySelectorAll("button")).find((entry) =>
      entry.getAttribute("aria-label") === label || entry.textContent?.trim() === label);
    if (!found) throw new Error("Missing button: " + label);
    return found;
  }
  async function click(element: HTMLElement) { await act(async () => element.click()); }
  function panel() {
    const element = container.querySelector<HTMLElement>("#topbar-quick-access");
    if (!element) throw new Error("Missing launcher");
    return element;
  }
  async function open() { await click(button("Open Quick Access")); }

  it.each(["/today", "/projects", "/goals", "/calendar", "/finance", "/journal", "/knowledge", "/settings"])(
    "offers the global trigger without dashboard controls on %s", async (path) => {
      await render(path);
      expect(button("Open Quick Access").getAttribute("aria-expanded")).toBe("false");
      expect(container.querySelector('[aria-controls="topbar-dashboard-controls"]')).toBeNull();
    });

  it("retains Home customization and toggles a keyboard-focusable launcher", async () => {
    await render("/");
    expect(container.querySelector('[aria-controls="topbar-dashboard-controls"]')).not.toBeNull();
    const trigger = button("Open Quick Access");
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.tabIndex).toBe(0);
    trigger.focus();
    await open();
    await until(() => expect(document.activeElement).toBe(button("Close", panel())));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    await until(() => expect(document.activeElement).toBe(trigger));
    expect(container.querySelector("#topbar-quick-access")).toBeNull();
    await open();
    await click(trigger);
    expect(container.querySelector("#topbar-quick-access")).toBeNull();
  });

  it("dismisses outside, stays open inside, and excludes other panels", async () => {
    await render();
    await open();
    await act(async () => { panel().dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(panel()).toBeDefined();
    await act(async () => { document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); });
    expect(container.querySelector("#topbar-quick-access")).toBeNull();
    await open();
    await click(button("Appearance"));
    expect(container.querySelector("#topbar-quick-access")).toBeNull();
    await open();
    expect(container.querySelector("#topbar-theme-controls")).toBeNull();
    await render("/today", undefined, true);
    expect(container.querySelector("#topbar-quick-access")).toBeNull();
  });

  it("navigates to the resolved Knowledge record, closes, and marks only matching record links current", async () => {
    const note = await storage.knowledge.create({ title: "Pinned note", type: "note", content: "Content" });
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", note.id)] });
    await render("/knowledge?focusId=other");
    await open();
    await until(() => expect(panel().querySelector("li a")?.textContent).toContain(note.title));
    const link = panel().querySelector<HTMLAnchorElement>("li a")!;
    expect(link.getAttribute("href")).toBe("/knowledge?focusId=" + note.id);
    expect(link.hasAttribute("aria-current")).toBe(false);
    expect(link.tabIndex).toBe(0);
    link.focus();
    expect(document.activeElement).toBe(link);
    await click(link);
    expect(container.querySelector("[data-location]")?.textContent).toBe("/knowledge?focusId=" + note.id);
    expect(container.querySelector("#topbar-quick-access")).toBeNull();
    await open();
    await until(() => expect(panel().querySelector('a[aria-current="page"]')?.textContent).toContain(note.title));
  });

  it("shares additions, removal, and management ordering with the Home launcher", async () => {
    const note = await storage.knowledge.create({ title: "Shared note", type: "note", content: "Content" });
    await render("/", <><QuickAccessToggleButton itemType="knowledge" targetId={note.id} /><QuickAccessLauncher /></>);
    await open();
    await until(() => expect(panel().textContent).toContain("No shortcuts yet"));
    await click(button("Add to Quick Access"));
    await until(() => expect(container.querySelectorAll("li a")).toHaveLength(2));
    await click(button("Remove Shared note from Quick Access", panel()));
    await until(() => expect(container.querySelectorAll("li a")).toHaveLength(0));
    expect(readQuickAccessPreference().items).toHaveLength(0);
    await click(button("Manage shortcuts", panel()));
    await click(button("Add Today", panel()));
    await until(() => expect(container.querySelectorAll("li a")).toHaveLength(2));
    await click(button("Add Calendar", panel()));
    await until(() => expect(container.querySelectorAll("li a")).toHaveLength(4));
    await click(button("Move shortcut down", panel()));
    await until(() => expect(Array.from(container.querySelectorAll("li a")).map((link) => link.getAttribute("href")))
      .toEqual(["/calendar", "/today", "/calendar", "/today"]));
    await click(button("Close", panel()));
    await open();
    await until(() => expect(panel().querySelector("li a")?.getAttribute("href")).toBe("/calendar"));
    expect(readQuickAccessPreference().items.map((item) => item.id)).toEqual(["module:calendar", "module:today"]);
  });

  it("keeps obsolete targets non-navigable and reports failed persistence without removing them", async () => {
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", "deleted")] });
    await render();
    await open();
    await until(() => expect(panel().querySelector('[aria-disabled="true"]')?.textContent).toContain("Unavailable"));
    expect(panel().querySelector("li a")).toBeNull();
    const save = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Quota"); });
    await click(button("Remove Unavailable from Quick Access", panel()));
    await until(() => expect(panel().querySelector('[role="alert"]')?.textContent).toContain("could not be saved"));
    expect(readQuickAccessPreference().items).toHaveLength(1);
    save.mockRestore();
    await click(button("Remove Unavailable from Quick Access", panel()));
    await until(() => expect(panel().textContent).toContain("No shortcuts yet"));
  });

  it("reads saved module shortcuts and indicates the current page", async () => {
    writeQuickAccessPreference({ version: 1, items: [createModuleQuickAccessItem("today", 0)] });
    await render();
    await open();
    await until(() => expect(panel().querySelector('a[aria-current="page"]')?.textContent).toBe("Today"));
  });

  it("shows pending resolution and a retryable error instead of an empty state", async () => {
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", "missing")] });
    let rejectRead: (error: Error) => void = () => {};
    vi.spyOn(storage.knowledge, "list").mockImplementationOnce(() => new Promise((_, reject) => { rejectRead = reject; }));
    await render();
    await open();
    expect(panel().querySelector('[aria-busy="true"]')?.textContent).toBe("Loading shortcuts…");
    expect(panel().textContent).not.toContain("No shortcuts yet");
    await act(async () => rejectRead(new Error("Unavailable storage")));
    expect(panel().querySelector('[role="alert"]')?.textContent).toContain("could not be loaded");
    await click(button("Try again", panel()));
    await until(() => expect(panel().querySelector('[aria-disabled="true"]')?.textContent).toContain("Unavailable"));
  });

  it.each([["fa", "rtl", "باز کردن دسترسی سریع"], ["en", "ltr", "Open Quick Access"]] as const)(
    "localizes the global controls in %s", async (language, direction, label) => {
      await loadMessages(language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      await render();
      const trigger = button(label);
      expect(trigger.title).toBe(label);
      await click(trigger);
      expect(panel().querySelector("[dir]")?.getAttribute("dir")).toBe(direction);
      expect(panel().textContent).not.toContain("quickAccess.");
    });
});
