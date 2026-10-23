// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAdapterProvider } from "@/core/storage";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { DISPLAY_NAME_STORAGE_KEY } from "@/shared/constants/preferences";
import { I18nProvider, LANGUAGE_STORAGE_KEY, useI18n } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { Topbar } from "../Topbar";

function Harness({ overlay }: { overlay: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setLanguage } = useI18n();
  return <><Topbar title="AliOS" onOpenMobileSidebar={() => {}} onOpenCommandPalette={() => {}}
    showDashboardControls={location.pathname === "/"} shellOverlayOpen={overlay} />
    <output data-location>{location.pathname}{location.search}</output>
    <button onClick={() => navigate("/today")}>Go Today</button>
    <button onClick={() => navigate("/?panel=dashboard")}>Customize</button>
    <button onClick={() => navigate(-1)}>Back</button>
    <button onClick={() => navigate(1)}>Forward</button>
    <button onClick={() => setLanguage("fa")}>Translate</button>
  </>;
}

describe("E3 shell integration with committed Settings destinations", () => {
  let root: Root;
  let host: HTMLDivElement;
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    localStorage.clear(); window.localStorage.clear();
    for (const store of [localStorage, window.localStorage]) {
      store.setItem(LANGUAGE_STORAGE_KEY, "en"); store.setItem(DISPLAY_NAME_STORAGE_KEY, "Sadegh");
    }
    await loadMessages("en"); await loadMessages("fa");
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks();
    await destroyTestDatabase(database);
  });
  async function render(path = "/", overlay = false) {
    await act(async () => root.render(<StrictMode><MemoryRouter initialEntries={[path]}><I18nProvider>
      <StorageAdapterProvider adapter={storage}><Harness overlay={overlay} /></StorageAdapterProvider>
    </I18nProvider></MemoryRouter></StrictMode>));
  }
  function button(label: string) {
    const found = [...host.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === label || node.getAttribute("aria-label") === label);
    if (!found) throw new Error(`Missing button: ${label}`);
    return found;
  }
  async function click(element: HTMLElement) { await act(async () => element.click()); }
  async function until(assertion: () => void) {
    await vi.waitFor(async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); assertion(); });
  }
  function dashboard() { return host.querySelector<HTMLElement>("#topbar-dashboard-controls"); }
  async function escape() { await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))); }

  it.each(["en", "fa"])("routes named profile and appearance controls to E2 in %s", async language => {
    for (const store of [localStorage, window.localStorage]) store.setItem(LANGUAGE_STORAGE_KEY, language);
    await render("/today");
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
    const profile = host.querySelector<HTMLButtonElement>('[aria-controls="topbar-profile-controls"]')!;
    await click(profile);
    const panel = host.querySelector<HTMLElement>("#topbar-profile-controls")!;
    expect(panel.textContent).toContain("Sadegh");
    expect(panel.querySelector("form,input")).toBeNull();
    const link = panel.querySelector<HTMLAnchorElement>("a")!;
    expect(link.getAttribute("href")).toBe("/settings?tab=profile");
    expect(link.textContent).toBe(language === "fa" ? "ویرایش پروفایل محلی" : "Edit local profile");
    await click(link); expect(host.querySelector("[data-location]")?.textContent).toBe("/settings?tab=profile");
    expect(host.querySelector("#topbar-profile-controls")).toBeNull();
    const appearance = host.querySelector<HTMLAnchorElement>('a[href="/settings?tab=appearance"]')!;
    expect(appearance.getAttribute("aria-label")).toBe(language === "fa" ? "ظاهر" : "Appearance");
    await click(appearance); expect(host.querySelector("[data-location]")?.textContent).toBe("/settings?tab=appearance");
    expect(host.querySelector("#topbar-theme-controls")).toBeNull();
  });

  it("opens a cold dashboard URL, focuses the lazy panel and restores the trigger on Escape", async () => {
    await render("/?panel=dashboard");
    await until(() => expect(dashboard()?.querySelector('button[aria-label="Close"]')).not.toBeNull());
    const close = dashboard()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
    await until(() => expect(document.activeElement).toBe(close));
    await escape(); expect(dashboard()).toBeNull();
    await until(() => expect(document.activeElement).toBe(host.querySelector('[aria-controls="topbar-dashboard-controls"]')));
    await click(button("Translate")); expect(dashboard()).toBeNull();
  });

  it("consumes dismissal in the current entry but reopens on Back and Forward", async () => {
    await render("/?panel=dashboard"); await until(() => expect(dashboard()).not.toBeNull());
    await escape(); expect(dashboard()).toBeNull();
    await click(button("Go Today")); expect(dashboard()).toBeNull();
    await click(button("Back")); await until(() => expect(dashboard()).not.toBeNull());
    await click(button("Forward")); expect(dashboard()).toBeNull();
    await click(button("Customize")); await until(() => expect(dashboard()).not.toBeNull());
  });

  it("closes a dashboard for a shell overlay without reopening it after dismissal", async () => {
    await render("/?panel=dashboard"); await until(() => expect(dashboard()).not.toBeNull());
    await render("/?panel=dashboard", true); expect(dashboard()).toBeNull();
    await render("/?panel=dashboard", false); expect(dashboard()).toBeNull();
    await click(button("Customize")); await until(() => expect(dashboard()).not.toBeNull());
  });

  it.each(["/today?panel=dashboard", "/?panel=unknown"])("ignores invalid dashboard destinations %s", async path => {
    await render(path); expect(dashboard()).toBeNull();
  });

  it("closes a profile preview on history navigation and does not carry overlays between routes", async () => {
    await render(); await click(button("Local profile"));
    expect(host.querySelector("#topbar-profile-controls")).not.toBeNull();
    await click(button("Go Today")); expect(host.querySelector("#topbar-profile-controls")).toBeNull();
    await click(button("Back")); expect(host.querySelector("#topbar-profile-controls")).toBeNull();
  });
});
