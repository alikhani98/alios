// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAdapterProvider } from "@/core/storage";
import { DexieStorageAdapter, type AliosDatabase } from "@/db/dexie";
import { UnifiedHomePage } from "@/features/home/pages/UnifiedHomePage";
import { KnowledgePage } from "@/features/knowledge/pages/KnowledgePage";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { KNOWLEDGE_ITEM_TYPE_VALUES } from "@/shared/constants/domain";
import { goalInput, projectInput, resourceInput, routineInput } from "@/test/factories";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { QuickAccessLauncher } from "../QuickAccessLauncher";
import { QuickAccessToggleButton } from "../QuickAccessToggleButton";
import {
  createQuickAccessItem, QUICK_ACCESS_MODULES, createModuleQuickAccessItem,
  readQuickAccessPreference, writeQuickAccessPreference,
  QUICK_ACCESS_STORAGE_KEY,
} from "../quickAccess";

function CurrentLocation() {
  const location = useLocation();
  return <output data-location>{location.pathname}{location.search}</output>;
}

describe("Quick Access on Home", () => {
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
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    await destroyTestDatabase(database);
  });

  async function render(children: ReactNode = <QuickAccessLauncher />, key = "initial", adapter = storage) {
    await act(async () => {
      root.render(<MemoryRouter key={key}>
        <I18nProvider><DateDisplayProvider><StorageAdapterProvider adapter={adapter}>
          {children}<CurrentLocation />
        </StorageAdapterProvider></DateDisplayProvider></I18nProvider>
      </MemoryRouter>);
    });
  }

  async function until(assertion: () => void) {
    await vi.waitFor(async () => {
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      assertion();
    });
  }

  function button(label: string) {
    const found = Array.from(container.querySelectorAll("button"))
      .find((entry) => entry.textContent?.trim() === label || entry.getAttribute("aria-label") === label);
    if (!found) throw new Error("Missing button: " + label);
    return found;
  }

  async function click(element: HTMLElement) {
    await act(async () => { element.click(); });
  }

  function shortcut(title: string) {
    return Array.from(container.querySelectorAll<HTMLAnchorElement>("li a"))
      .find((entry) => entry.textContent?.includes(title));
  }

  it("adds from the real Knowledge menu, renders on Home, opens the original item and persists after remount", async () => {
    const note = await storage.knowledge.create({ title: "Original note", type: "note", summary: "My summary", content: "Original content" });
    const app = <>
      <Link to="/knowledge">Browse Knowledge</Link><Link to="/">Go Home</Link>
      <Routes><Route path="/" element={<UnifiedHomePage />} /><Route path="/knowledge" element={<KnowledgePage />} /></Routes>
    </>;
    await render(app);
    await until(() => expect(container.textContent).toContain("Choose shortcuts"));
    await click(Array.from(container.querySelectorAll("a")).find((a) => a.textContent === "Browse Knowledge")!);
    await until(() => expect(container.querySelector('button[aria-label="Quick actions"]')).not.toBeNull());
    await click(button("Quick actions"));
    await click(button("Add to Quick Access"));
    expect(readQuickAccessPreference().items).toHaveLength(1);
    await click(Array.from(container.querySelectorAll("a")).find((a) => a.textContent === "Go Home")!);
    await until(() => expect(shortcut(note.title)?.getAttribute("href")).toBe("/knowledge?focusId=" + note.id));
    expect(shortcut(note.title)?.textContent).toContain("My summary");
    await click(shortcut(note.title)!);
    await until(() => expect(container.querySelector("[data-location]")?.textContent).toBe("/knowledge?focusId=" + note.id));
    expect(container.textContent).toContain("Original content");
    await render(app, "reload");
    await until(() => expect(shortcut(note.title)).toBeDefined());
    const deleteEntity = vi.spyOn(storage.knowledge, "delete");
    await click(button("Remove Original note from Quick Access"));
    await until(() => expect(shortcut(note.title)).toBeUndefined());
    expect(deleteEntity).not.toHaveBeenCalled();
    expect(await storage.knowledge.getById(note.id)).toMatchObject({ content: "Original content" });
    await render(app, "reload-after-remove");
    await until(() => expect(container.textContent).toContain("Choose shortcuts"));
    expect(readQuickAccessPreference().items).toEqual([]);
  });

  it("renders all selected modules beyond eight and opens the existing manager from empty state", async () => {
    await render();
    await until(() => expect(container.textContent).toContain("No shortcuts yet"));
    await click(button("Choose shortcuts"));
    await click(button("Add Today"));
    await until(() => expect(shortcut("Today")?.getAttribute("href")).toBe("/today"));
    await act(async () => { writeQuickAccessPreference({ version: 1, items: QUICK_ACCESS_MODULES.map((item, index) => createModuleQuickAccessItem(item.id, index)) }); });
    await until(() => expect(container.querySelectorAll("li a")).toHaveLength(QUICK_ACCESS_MODULES.length));
    expect(Array.from(container.querySelectorAll("li a")).map((link) => link.getAttribute("href")))
      .toEqual(QUICK_ACCESS_MODULES.map((item) => item.route));
  });

  it("resolves the original routes for every supported entity after reopening local storage", async () => {
    const goal = await storage.goals.create(goalInput);
    const project = await storage.projects.create(projectInput);
    const resource = await storage.resources.create(resourceInput);
    const routine = await storage.routines.create(routineInput);
    const selections = [
      createQuickAccessItem("goal", goal.id), createQuickAccessItem("project", project.id),
      createQuickAccessItem("resource", resource.id), createQuickAccessItem("routine", routine.id),
    ];
    writeQuickAccessPreference({ version: 1, items: selections.map((item, order) => ({ ...item, order })) });
    database.close();
    await database.open();
    await render();
    await until(() => expect(container.querySelectorAll("li a")).toHaveLength(4));
    expect(Array.from(container.querySelectorAll("li a")).map((link) => link.getAttribute("href")))
      .toEqual([
        "/goals?focusId=" + goal.id, "/projects?focusId=" + project.id,
        "/resources?focusId=" + resource.id, "/routines?focusId=" + routine.id,
      ]);
    expect(shortcut(goal.title)?.textContent).toContain(goal.description);
    expect(readQuickAccessPreference().items).toHaveLength(4);
  });

  it("reflects selections changed in another tab and ignores unrelated preference events", async () => {
    await render();
    await until(() => expect(container.textContent).toContain("No shortcuts yet"));
    window.localStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify({
      version: 1, items: [createModuleQuickAccessItem("today", 0)],
    }));
    await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: QUICK_ACCESS_STORAGE_KEY })); });
    await until(() => expect(shortcut("Today")).toBeDefined());
    await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: LANGUAGE_STORAGE_KEY })); });
    expect(shortcut("Today")).toBeDefined();
    window.localStorage.setItem(QUICK_ACCESS_STORAGE_KEY, JSON.stringify({ version: 1, items: [] }));
    await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: QUICK_ACCESS_STORAGE_KEY })); });
    await until(() => expect(shortcut("Today")).toBeUndefined());
  });

  it.each(KNOWLEDGE_ITEM_TYPE_VALUES)("supports the actual Knowledge type %s and suppresses duplicate activation", async (type) => {
    const note = await storage.knowledge.create({ title: "Selected " + type, type, content: "Content" });
    await render(<><QuickAccessToggleButton itemType="knowledge" targetId={note.id} /><QuickAccessLauncher /></>);
    const add = button("Add to Quick Access");
    await act(async () => { add.click(); add.click(); });
    await until(() => expect(shortcut(note.title)).toBeDefined());
    expect(readQuickAccessPreference().items).toHaveLength(1);
    expect(button("Remove from Quick Access").getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps deleted targets unavailable and removable without a placeholder link", async () => {
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", "deleted")] });
    await render();
    await until(() => expect(container.querySelector('[aria-disabled="true"]')?.textContent).toContain("Unavailable"));
    expect(container.querySelector("li a")).toBeNull();
    await click(button("Remove Unavailable from Quick Access"));
    await until(() => expect(container.textContent).toContain("No shortcuts yet"));
  });

  it("shows loading and retryable read errors without presenting failure as an empty selection", async () => {
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", "pending")] });
    let fail: (error: Error) => void = () => {};
    vi.spyOn(storage.knowledge, "list").mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; }));
    await render();
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe("Loading shortcuts…");
    expect(container.textContent).not.toContain("No shortcuts yet");
    await act(async () => { fail(new Error("Unavailable storage")); });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("could not be loaded");
    await click(button("Try again"));
    await until(() => expect(container.textContent).toContain("Unavailable"));
  });

  it("keeps shortcuts after failed writes and reports manager save errors", async () => {
    writeQuickAccessPreference({ version: 1, items: [createModuleQuickAccessItem("today", 0)] });
    await render();
    await until(() => expect(shortcut("Today")).toBeDefined());
    const save = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Quota"); });
    await click(button("Remove Today from Quick Access"));
    await until(() => expect(shortcut("Today")).toBeDefined());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("could not be saved");
    expect(readQuickAccessPreference().items).toHaveLength(1);
    await click(button("Manage shortcuts"));
    await until(() => expect(button("Enabled")).toBeDefined());
    await click(button("Enabled"));
    expect(button("Enabled").getAttribute("aria-pressed")).toBe("true");
    save.mockRestore();
    await click(button("Enabled"));
    await until(() => expect(shortcut("Today")).toBeUndefined());
    await click(button("Disabled"));
    await until(() => expect(shortcut("Today")).toBeDefined());
  });

  it("uses only the current local adapter and discards stale pending results", async () => {
    const note = await storage.knowledge.create({ title: "Old workspace title", type: "note", content: "Content" });
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", note.id)] });
    let resolveOld: (items: Awaited<ReturnType<typeof storage.knowledge.list>>) => void = () => {};
    vi.spyOn(storage.knowledge, "list").mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    await render();
    const otherAdapter = new DexieStorageAdapter(database);
    vi.spyOn(otherAdapter.knowledge, "list").mockResolvedValue([]);
    await render(<QuickAccessLauncher />, "initial", otherAdapter);
    await until(() => expect(container.textContent).toContain("Unavailable"));
    await act(async () => { resolveOld([note]); });
    expect(container.textContent).not.toContain("Old workspace title");
    expect(container.querySelector("li a")).toBeNull();
  });

  it("refreshes titles and missing targets when returning to the browser tab", async () => {
    const note = await storage.knowledge.create({ title: "Before rename", type: "note", content: "Content" });
    writeQuickAccessPreference({ version: 1, items: [createQuickAccessItem("knowledge", note.id)] });
    await render();
    await until(() => expect(shortcut(note.title)).toBeDefined());
    await storage.knowledge.update(note.id, { title: "Renamed" });
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    await until(() => expect(shortcut("Renamed")).toBeDefined());
    await storage.knowledge.delete(note.id);
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    await until(() => expect(container.querySelector("li a")).toBeNull());
  });

  it.each([["fa", "rtl", "دسترسی سریع"], ["en", "ltr", "Quick Access"]] as const)(
    "presents %s labels and direction", async (language, direction, title) => {
      await loadMessages(language);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      await render();
      await until(() => expect(container.querySelector("h2")?.textContent).toBe(title));
      expect(container.querySelector("section")?.getAttribute("dir")).toBe(direction);
      expect(document.documentElement.dir).toBe(direction);
    }
  );
});
