// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CALENDAR_DISPLAY_STORAGE_KEY } from "@/shared/date/formatDate";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { APPEARANCE_STORAGE_KEY, APPEARANCE_SCHEDULE_START_STORAGE_KEY } from "@/shared/constants/preferences";
import { HOME_DASHBOARD_LAYOUT_STORAGE_KEY } from "@/features/home/dashboardLayout";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { messagesEn } from "@/shared/i18n/messages.en";
import { SettingsPage } from "../pages/SettingsPage";

const actions = vi.hoisted(() => ({ exportBackup: vi.fn(), confirmRestore: vi.fn(), confirmClear: vi.fn(), loadSummary: vi.fn() }));
vi.mock("@/core/account", () => ({ useAccountRuntimeState: () => ({ localOnly: true, hasActiveAccount: false }) }));
vi.mock("@/core/auth", () => ({ useAuthSession: () => ({ status: "signed-out" }) }));
vi.mock("@/core/sync", () => ({ getSupabaseSyncConfiguration: () => null }));
vi.mock("../hooks/useLocalDataManagement", () => ({ useLocalDataManagement: () => ({
  summary: null, isLoading: false, isClearing: false, isConfirmingClear: false, error: null, success: null,
  loadSummary: actions.loadSummary, requestClear: vi.fn(), cancelClear: vi.fn(), confirmClear: actions.confirmClear,
}) }));
vi.mock("../hooks/useBackupRestore", () => ({ useBackupRestore: () => ({
  pendingBackup: null, pendingFilename: null, lastBackupExportedAt: null, lastRestoredAt: null, backupFreshness: "never", success: null, error: null,
  isExporting: false, isRestoring: false, exportBackup: actions.exportBackup, selectBackup: vi.fn(), confirmRestore: actions.confirmRestore, cancelRestore: vi.fn(),
}) }));
vi.mock("@/features/reminders", () => ({
  getWebPushCapabilities: () => ({ supported: false }),
  TelegramReminderSettings: () => <div>Existing Telegram controls</div>,
  WebPushReminderSettings: () => <div>Existing Web Push controls</div>,
  ReminderChannelSelector: () => <div>Existing channel selector</div>,
}));
vi.mock("@/features/attachments", () => ({ AttachmentPackageSection: () => <div>Existing attachment package</div> }));
vi.mock("../components/SyncStatusCard", () => ({ SyncStatusCard: ({ onGoToBackupRestore }: { onGoToBackupRestore: () => void }) => <button onClick={onGoToBackupRestore}>Go to backup</button> }));
vi.mock("@/shared/quickAccess/QuickAccessManager", () => ({ QuickAccessManager: () => <div>Existing Quick Access management</div> }));
vi.mock("../components/WeeklyTaskBudgetSection", () => ({ WeeklyTaskBudgetSection: () => <div>Existing weekly budget</div> }));
vi.mock("../components/ExportCenterSection", () => ({ ExportCenterSection: ({ id }: { id: string }) => <section id={id}>Existing exports</section> }));
vi.mock("../components/StorageUsageMonitor", () => ({ StorageUsageMonitor: () => null }));
vi.mock("../components/LocalErrorLogSection", () => ({ LocalErrorLogSection: ({ id }: { id: string }) => <section id={id}>Existing local errors</section> }));
vi.mock("../components/AISettingsCard", () => ({ AISettingsCard: () => null }));
vi.mock("@/features/localAi/components/LocalAiSetupCard", () => ({ LocalAiSetupCard: () => null }));

function NavigationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.search}{location.hash}</output><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button></>;
}

describe("Settings route and existing data entry points", () => {
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
  let container: HTMLDivElement;
  let root: Root;
  let originalLocalStorage: PropertyDescriptor | undefined;
  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    vi.clearAllMocks();
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
    vi.unstubAllGlobals();
    if (originalScrollIntoView) Object.defineProperty(Element.prototype, "scrollIntoView", originalScrollIntoView);
    else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    if (originalLocalStorage) Object.defineProperty(window, "localStorage", originalLocalStorage);
    else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(path: string, previousEntries: string[] = []) {
    await act(async () => root.render(<MemoryRouter initialEntries={[...previousEntries, path]}><I18nProvider><DateDisplayProvider><SettingsPage /><NavigationProbe /></DateDisplayProvider></I18nProvider></MemoryRouter>));
  }
  function disclosureOpen(id: string) {
    return document.getElementById(id)?.querySelector("button")?.getAttribute("aria-expanded");
  }

  it("opens the local profile directly and changes tabs without starting data operations", async () => {
    await render("/settings");
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe("General");
    const notifications = container.querySelector<HTMLButtonElement>("#settings-tab-notifications")!;
    await act(async () => notifications.click());
    expect(container.querySelector<HTMLElement>("#settings-panel-notifications")?.hidden).toBe(false);
    expect(container.querySelector("#settings-panel-notifications")?.textContent).toContain("Existing Web Push controls");
    expect(actions.exportBackup).not.toHaveBeenCalled();
    expect(actions.confirmRestore).not.toHaveBeenCalled();
    expect(actions.confirmClear).not.toHaveBeenCalled();
  });

  it("reveals an existing backup bookmark even when a different tab is in the URL", async () => {
    await render("/settings?tab=profile#settings-backup-restore");
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe("Data & Safety");
    expect(container.querySelector<HTMLElement>("#settings-panel-data")?.hidden).toBe(false);
    expect(disclosureOpen("settings-backup-export-group")).toBe("true");
    const exportButton = [...document.getElementById("settings-backup-restore")!.querySelectorAll("button")].find((button) => button.textContent?.includes("Export"))!;
    await act(async () => exportButton.click());
    expect(actions.exportBackup).toHaveBeenCalledTimes(1);
    expect(actions.confirmRestore).not.toHaveBeenCalled();
  });

  it("opens both ancestors of the local error log bookmark", async () => {
    await render("/settings#settings-local-error-log");
    expect(disclosureOpen("settings-advanced-developer-group")).toBe("true");
    expect(disclosureOpen("settings-advanced-local-tools")).toBe("true");
    expect(container.querySelector<HTMLElement>("#settings-local-error-log")?.closest('[hidden]')).toBeNull();
  });

  it("keeps the direct appearance destination and scheduled time fields on the existing route", async () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "scheduled");
    await render("/settings?tab=appearance");
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe("Appearance");
    expect(container.querySelectorAll('input[type="time"]')).toHaveLength(2);
    expect(container.querySelector('#settings-panel-appearance [aria-label="Accent color"]')).not.toBeNull();
    const start = container.querySelector<HTMLInputElement>('input[type="time"]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("Missing native input setter");
    await act(async () => {
      setter.call(start, "21:30");
      start.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(localStorage.getItem(APPEARANCE_SCHEDULE_START_STORAGE_KEY)).toBe("21:30");
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("scheduled");
  });

  it("changes and persists the real language and document direction", async () => {
    await render("/settings?tab=profile");
    const persian = [...container.querySelectorAll<HTMLButtonElement>("#settings-panel-general button")].find((button) => button.textContent?.trim() === "فارسی");
    if (!persian) throw new Error("Missing Persian language control");
    await act(async () => persian.click());
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fa");
    expect(document.documentElement.lang).toBe("fa");
    expect(document.documentElement.dir).toBe("rtl");
    expect(container.querySelector("#settings-tab-general")?.textContent).toBe("عمومی");
  });
  it.each([
    ["profile", "general"], ["general", "general"], ["appearance", "appearance"],
    ["workspace", "workspace"], ["notifications", "notifications"], ["account", "account"], ["data", "data"],
  ])("opens and retains the direct %s destination", async (query, category) => {
    await render(`/settings?tab=${query}&safe=1`);
    expect(container.querySelector(`#settings-tab-${category}`)?.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector<HTMLElement>(`#settings-panel-${category}`)?.hidden).toBe(false);
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain("safe=1");
  });

  it.each([
    ["settings-personalization-group", "workspace", "settings-personalization-group"],
    ["settings-additional-preferences", "workspace", "settings-additional-preferences"],
    ["settings-dashboard", "workspace", "settings-additional-preferences"],
    ["settings-account-sync-group", "account", "settings-account-sync-group"],
    ["settings-export-center", "data", "settings-export-center-group"],
    ["settings-local-data-details", "data", "settings-local-data-details"],
    ["settings-recovery-mode", "data", "settings-local-data-recovery-group"],
    ["settings-recovery-mode-details", "data", "settings-recovery-mode-details"],
    ["settings-help-planning-loop-guide", "help", "settings-help-planning-loop-guide"],
    ["settings-help-center", "help", "settings-help-center"],
    ["settings-app-info", "about", "settings-app-info"],
  ])("reveals the bookmarked %s subsection", async (hash, category, disclosure) => {
    await render(`/settings?tab=profile#${hash}`);
    expect(container.querySelector<HTMLElement>(`#settings-panel-${category}`)?.hidden).toBe(false);
    await vi.waitFor(async () => {
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
      expect(disclosureOpen(disclosure)).toBe("true");
    });
    expect(actions.confirmRestore).not.toHaveBeenCalled();
    expect(actions.confirmClear).not.toHaveBeenCalled();
  });

  it("retains a profile draft across categories and preserves unrelated query parameters", async () => {
    await render("/settings?tab=profile&safe=1");
    const draft = container.querySelector<HTMLInputElement>('#settings-panel-general input:not([type="file"])')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setter.call(draft, "Unsubmitted draft"); draft.dispatchEvent(new Event("input", { bubbles: true })); });
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-notifications")!.click());
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain("safe=1");
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-general")!.click());
    expect(container.querySelector('#settings-panel-general input:not([type="file"])')).toBe(draft);
    expect(draft.value).toBe("Unsubmitted draft");
  });

  it("navigates from account to backup while preserving safety parameters", async () => {
    await render("/settings?tab=account&safe=1");
    await act(async () => [...container.querySelectorAll("button")].find((button) => button.textContent === "Go to backup")!.click());
    expect(container.querySelector<HTMLElement>("#settings-panel-data")?.hidden).toBe(false);
    expect(disclosureOpen("settings-backup-export-group")).toBe("true");
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain("safe=1");
  });

  it("connects dashboard customization to the E3 Home panel destination", async () => {
    await render("/settings?tab=workspace#settings-dashboard");
    const link = container.querySelector<HTMLAnchorElement>('#settings-dashboard a');
    expect(link?.getAttribute("href")).toBe("/?panel=dashboard");
    expect(link?.textContent).toBe(messagesEn["home.customizeDashboard"]);
    expect(container.querySelector('a[href="/"]')).not.toBe(link);
  });

  it("preserves the E1 v2 accent during unreadable synchronization and accepts later valid updates", async () => {
    const key = "alios.preferences.accentColor";
    localStorage.setItem(key, "rose");
    await render("/settings?tab=appearance");
    const rose = [...container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find((button) => button.textContent?.trim() === messagesEn["settings.accentRose"])!;
    const original = window.localStorage.getItem.bind(window.localStorage);
    const readFailure = vi.spyOn(window.localStorage, "getItem").mockImplementation((entry) => { if (entry === key) throw new Error("blocked"); return original(entry); });
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key })));
    expect(rose.getAttribute("aria-pressed")).toBe("true");
    readFailure.mockRestore(); localStorage.setItem(key, "violet");
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key })));
    expect(rose.getAttribute("aria-pressed")).toBe("false");
    expect([...container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find((button) => button.textContent?.trim() === messagesEn["settings.accentViolet"])?.getAttribute("aria-pressed")).toBe("true");
  });

  it("pushes user tab selections into history and avoids mounting untouched destinations", async () => {
    await render("/settings?tab=general");
    expect(container.querySelector("#settings-panel-account button")).toBeNull();
    expect(container.querySelector("#settings-panel-notifications")?.textContent).toBe("");
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-appearance")!.click());
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-workspace")!.click());
    await act(async () => [...container.querySelectorAll("button")].find((item) => item.textContent === "Browser back")!.click());
    expect(container.querySelector<HTMLElement>("#settings-panel-appearance")?.hidden).toBe(false);
    await act(async () => [...container.querySelectorAll("button")].find((item) => item.textContent === "Browser back")!.click());
    expect(container.querySelector<HTMLElement>("#settings-panel-general")?.hidden).toBe(false);
  });

  it("updates active categories on browser back and forward", async () => {
    await render("/settings?tab=account", ["/settings?tab=workspace"]);
    const historyButton = (label: string) => [...container.querySelectorAll("button")].find((button) => button.textContent === label)!;
    await act(async () => historyButton("Browser back").click());
    expect(container.querySelector<HTMLElement>("#settings-panel-workspace")?.hidden).toBe(false);
    await act(async () => historyButton("Browser forward").click());
    expect(container.querySelector<HTMLElement>("#settings-panel-account")?.hidden).toBe(false);
  });

  it("focuses the revealed legacy error-log destination", async () => {
    await render("/settings?tab=profile#settings-local-error-log");
    await act(async () => { await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))); });
    expect(document.activeElement?.id).toBe("settings-local-error-log");
  });

  it("does not select a theme whose local write fails and allows retry", async () => {
    await render("/settings?tab=appearance");
    const dark = [...container.querySelectorAll<HTMLButtonElement>("button")].find((entry) => entry.textContent?.trim() === "Dark")!;
    const original = window.localStorage.setItem.bind(window.localStorage);
    const failure = vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
      if (key === APPEARANCE_STORAGE_KEY) throw new Error("private storage detail");
      original(key, value);
    });
    await act(async () => dark.click());
    expect(dark.getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).not.toBe("dark");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.localPersistenceError"]);
    failure.mockRestore();
    await act(async () => dark.click());
    expect(dark.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("dark");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("does not announce dashboard reset when removing the preference fails", async () => {
    const layout = JSON.stringify({ visible: ["calendar"], order: ["calendar"] });
    localStorage.setItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY, layout);
    await render("/settings?tab=workspace#settings-dashboard");
    const reset = [...container.querySelectorAll<HTMLButtonElement>("button")].find((entry) => entry.textContent?.trim() === messagesEn["home.resetDashboardLayout"])!;
    const original = window.localStorage.removeItem.bind(window.localStorage);
    const failure = vi.spyOn(window.localStorage, "removeItem").mockImplementation((key) => {
      if (key === HOME_DASHBOARD_LAYOUT_STORAGE_KEY) throw new Error("private removal detail");
      original(key);
    });
    await act(async () => reset.click());
    expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBe(layout);
    expect(container.querySelector('#settings-dashboard [role="alert"]')?.textContent).toBe(messagesEn["settings.localPersistenceError"]);
    expect(container.querySelector('#settings-dashboard [role="status"]')).toBeNull();
    expect(container.textContent).not.toContain(messagesEn["home.dashboardLayoutReset"]);
    failure.mockRestore();
    await act(async () => reset.click());
    expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBeNull();
    expect(container.querySelector('#settings-dashboard [role="alert"]')).toBeNull();
    expect(container.querySelector('#settings-dashboard [role="status"]')?.textContent).toBe(messagesEn["home.dashboardLayoutReset"]);
  });

  it("retains Simple View after failed reset and retries without changing its default contract", async () => {
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");
    await render("/settings?tab=appearance");
    const reset = [...container.querySelectorAll<HTMLButtonElement>("button")].find((entry) => entry.textContent?.trim() === "Reset to Full View")!;
    const original = window.localStorage.removeItem.bind(window.localStorage);
    const failure = vi.spyOn(window.localStorage, "removeItem").mockImplementation((key) => {
      if (key === VIEW_DENSITY_MODE_STORAGE_KEY) throw new Error("storage blocked");
      original(key);
    });
    await act(async () => reset.click());
    expect(container.querySelector<HTMLInputElement>('input[name="viewDensityMode"]:checked')?.value).toBe("simple");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.localPersistenceError"]);
    failure.mockRestore();
    await act(async () => reset.click());
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[name="viewDensityMode"]:checked')?.value).toBe("full");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it.each([
    [CALENDAR_DISPLAY_STORAGE_KEY, "gregorian", "jalali", messagesEn["settings.calendarJalali"], "#settings-calendar"],
  ])("retains the selected value when writing %s fails, then retries", async (key, before, after, label, selector) => {
    localStorage.setItem(key, before);
    await render("/settings?tab=general");
    const control = [...container.querySelectorAll<HTMLButtonElement>(`${selector} button`)].find((entry) => entry.textContent?.trim() === label);
    if (!control) throw new Error(`Missing control: ${label}`);
    const original = window.localStorage.setItem.bind(window.localStorage);
    const failure = vi.spyOn(window.localStorage, "setItem").mockImplementation((entry, value) => {
      if (entry === key) throw new Error("storage blocked");
      original(entry, value);
    });
    await act(async () => control.click());
    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem(key)).toBe(before);
    expect(document.documentElement.dir).toBe("ltr");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.localPersistenceError"]);
    failure.mockRestore();
    await act(async () => control.click());
    expect(control.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem(key)).toBe(after);
    expect(document.documentElement.dir).toBe(key === LANGUAGE_STORAGE_KEY ? "rtl" : "ltr");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it.each(["en", "fa"] as const)("applies Simple View presentation immediately, across tabs and remounts (%s)", async (language) => {
    await loadMessages("en");
    await loadMessages("fa");
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "en" ? messagesEn : messagesFa;
    await render("/settings?tab=appearance");
    const mode = (value: string) => container.querySelector<HTMLInputElement>(`input[name="viewDensityMode"][value="${value}"]`)!;
    const appearance = () => container.querySelector<HTMLElement>('[role="group"][aria-label="' + messages["settings.appearance"] + '"]')!;
    expect(appearance().querySelectorAll("[data-theme-preview]")).toHaveLength(4);
    await act(async () => mode("simple").click());
    expect(mode("simple").checked).toBe(true);
    expect(mode("full").checked).toBe(false);
    expect(appearance().querySelectorAll("[data-theme-preview]")).toHaveLength(0);
    expect(appearance().querySelectorAll("button")).toHaveLength(4);
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
    for (const [key, stored] of [["settings.light", "light"], ["settings.dark", "dark"], ["settings.system", "system"]] as const) {
      const theme = [...appearance().querySelectorAll("button")].find((entry) => entry.textContent?.trim() === messages[key])!;
      await act(async () => theme.click());
      expect(theme.getAttribute("aria-pressed")).toBe("true");
      expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe(stored);
      expect(mode("simple").checked).toBe(true);
      expect(appearance().querySelectorAll("[data-theme-preview]")).toHaveLength(0);
    }
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-workspace")!.click());
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-appearance")!.click());
    expect(mode("simple").checked).toBe(true);
    expect(appearance().querySelectorAll("[data-theme-preview]")).toHaveLength(0);
    await act(async () => root.render(null));
    await render("/settings?tab=appearance");
    expect(mode("simple").checked).toBe(true);
    expect(appearance().querySelectorAll("[data-theme-preview]")).toHaveLength(0);
    await act(async () => mode("full").click());
    expect(mode("full").checked).toBe(true);
    expect(appearance().querySelectorAll("[data-theme-preview]")).toHaveLength(4);
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
  });

  it("retains the effective Simple View presentation when the language changes", async () => {
    await loadMessages("en");
    await loadMessages("fa");
    await render("/settings?tab=appearance");
    await act(async () => container.querySelector<HTMLInputElement>('input[name="viewDensityMode"][value="simple"]')!.click());
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-general")!.click());
    const persian = [...container.querySelectorAll<HTMLButtonElement>("#settings-language button")].find((entry) => entry.textContent?.trim() === "فارسی")!;
    await act(async () => persian.click());
    await act(async () => container.querySelector<HTMLButtonElement>("#settings-tab-appearance")!.click());
    expect(document.documentElement.dir).toBe("rtl");
    expect(container.querySelector<HTMLInputElement>('input[name="viewDensityMode"]:checked')?.value).toBe("simple");
    expect(container.querySelectorAll("[data-theme-preview]")).toHaveLength(0);
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
    expect(container.textContent).toContain("حالت فعال: نمای ساده");
  });

  it.each(["invalid", "unavailable"])("renders the safe Full View presentation for %s storage", async (scenario) => {
    await loadMessages("en");
    await loadMessages("fa");
    if (scenario === "invalid") {
      localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "compact");
    } else {
      const original = window.localStorage.getItem.bind(window.localStorage);
      vi.spyOn(window.localStorage, "getItem").mockImplementation((key) => {
        if (key === VIEW_DENSITY_MODE_STORAGE_KEY) throw new Error("storage unavailable");
        return original(key);
      });
    }
    await render("/settings?tab=appearance");
    expect(container.querySelector<HTMLInputElement>('input[name="viewDensityMode"]:checked')?.value).toBe("full");
    expect(container.querySelectorAll("[data-theme-preview]")).toHaveLength(4);
  });

});
