// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY, useI18n } from "@/shared/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import type { TelegramReminderPreference, TelegramReminderPreferenceInput } from "@/features/reminders/telegramReminderSettings";
import { SettingsPage } from "../pages/SettingsPage";

const actions = vi.hoisted(() => ({ exportBackup: vi.fn(), confirmRestore: vi.fn(), confirmClear: vi.fn(), loadSummary: vi.fn() }));
const remote = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), test: vi.fn(), subscribe: vi.fn(), register: vi.fn(), remove: vi.fn(),
  userId: "account-a", permission: "granted", capabilities: vi.fn() }));
vi.mock("@/core/account", () => ({ useAccountRuntimeState: () => ({ localOnly: true, hasActiveAccount: false }) }));
vi.mock("@/core/auth", () => ({ useAuthSession: () => ({ status: "authenticated", provider: "email", user: { userId: remote.userId } }) }));
vi.mock("@/core/sync", () => ({ getSupabaseSyncConfiguration: () => ({ url: "https://example.invalid", anonKey: "public-test-key" }) }));
vi.mock("@/features/reminders/telegramReminderSettingsClient", () => ({ loadTelegramReminderPreference: remote.load, saveTelegramReminderPreference: remote.save, sendTelegramReminderTest: remote.test }));
vi.mock("@/features/reminders/webPushSubscription", () => ({ getWebPushCapabilities: remote.capabilities,
  getWebPushPermissionState: () => remote.permission, getVapidPublicKey: () => "public-test-key", requestWebPushSubscription: remote.subscribe }));
vi.mock("@/features/reminders/webPushSubscriptionClient", () => ({ registerWebPushSubscription: remote.register, deleteWebPushSubscription: remote.remove }));
vi.mock("../hooks/useLocalDataManagement", () => ({ useLocalDataManagement: () => ({
  summary: null, isLoading: false, isClearing: false, isConfirmingClear: false, error: null, success: null,
  loadSummary: actions.loadSummary, requestClear: vi.fn(), cancelClear: vi.fn(), confirmClear: actions.confirmClear,
}) }));
vi.mock("../hooks/useBackupRestore", () => ({ useBackupRestore: () => ({
  pendingBackup: null, pendingFilename: null, lastBackupExportedAt: null, lastRestoredAt: null, backupFreshness: "never", success: null, error: null,
  isExporting: false, isRestoring: false, exportBackup: actions.exportBackup, selectBackup: vi.fn(), confirmRestore: actions.confirmRestore, cancelRestore: vi.fn(),
}) }));
vi.mock("@/features/attachments", () => ({ AttachmentPackageSection: () => <div>Existing attachment package</div> }));
vi.mock("../components/SyncStatusCard", () => ({ SyncStatusCard: ({ onGoToBackupRestore }: { onGoToBackupRestore: () => void }) => <button onClick={onGoToBackupRestore}>Go to backup</button> }));
vi.mock("@/shared/quickAccess/QuickAccessManager", () => ({ QuickAccessManager: () => <div>Existing Quick Access management</div> }));
vi.mock("../components/WeeklyTaskBudgetSection", () => ({ WeeklyTaskBudgetSection: () => <div>Existing weekly budget</div> }));
vi.mock("../components/ExportCenterSection", () => ({ ExportCenterSection: ({ id }: { id: string }) => <section id={id}>Existing exports</section> }));
vi.mock("../components/StorageUsageMonitor", () => ({ StorageUsageMonitor: () => null }));
vi.mock("../components/LocalErrorLogSection", () => ({ LocalErrorLogSection: ({ id }: { id: string }) => <section id={id}>Existing local errors</section> }));
vi.mock("../components/AISettingsCard", () => ({ AISettingsCard: () => null }));
vi.mock("@/features/localAi/components/LocalAiSetupCard", () => ({ LocalAiSetupCard: () => null }));


function Controls() {
  const navigate = useNavigate(); const { setLanguage } = useI18n();
  return <><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => setLanguage("fa")}>Use Persian</button><button onClick={() => setLanguage("en")}>Use English</button></>;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(complete => { resolve = complete; });
  return { promise, resolve };
}

describe("real Settings Notifications integration", () => {
  let root: Root; let host: HTMLDivElement;
  let stored: TelegramReminderPreference;
  let subscription: PushSubscription | null;
  let readSubscription: ReturnType<typeof vi.fn>;
  let registration: ReturnType<typeof vi.fn>;
  let descriptor: PropertyDescriptor | undefined;
  let scrollDescriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    vi.clearAllMocks(); remote.userId = "account-a"; remote.permission = "granted";
    remote.capabilities.mockReturnValue({ supported: true });
    stored = { enabled: true, channel: "telegram", telegramChatId: "111", timezone: "UTC", morningTime: "08:00" };
    remote.load.mockReset().mockImplementation(async () => ({ ...stored }));
    remote.save.mockReset().mockImplementation(async (input: TelegramReminderPreferenceInput) => { stored = { ...input }; return { ...stored }; });
    remote.subscribe.mockReset(); remote.register.mockReset().mockResolvedValue(undefined); remote.remove.mockReset().mockResolvedValue(undefined);
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear(); localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    subscription = { endpoint: "https://push.example.invalid/device", unsubscribe: vi.fn(async () => { subscription = null; return true; }) } as unknown as PushSubscription;
    readSubscription = vi.fn(async () => subscription);
    registration = vi.fn(async () => ({ pushManager: { getSubscription: readSubscription } }));
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration: registration } });
    vi.stubGlobal("PushManager", class {});
    scrollDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor); else Reflect.deleteProperty(window, "localStorage");
    if (scrollDescriptor) Object.defineProperty(Element.prototype, "scrollIntoView", scrollDescriptor); else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });
  const messages = () => document.documentElement.lang === "fa" ? messagesFa : messagesEn;
  async function render(path = "/settings?tab=notifications") {
    await act(async () => root.render(<MemoryRouter initialEntries={[path]}><I18nProvider><DateDisplayProvider><SettingsPage /><Controls /></DateDisplayProvider></I18nProvider></MemoryRouter>));
  }
  const panel = () => host.querySelector<HTMLElement>("#settings-panel-notifications")!;
  const chat = () => panel().querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
  const time = () => panel().querySelector<HTMLInputElement>('input[type="time"]')!;
  const radio = (channel: string) => panel().querySelector<HTMLButtonElement>(`[data-channel="${channel}"]`)!;
  const selected = () => panel().querySelector('[role="radio"][aria-checked="true"]')?.getAttribute("data-channel");
  function button(label: string) {
    const result = [...host.querySelectorAll("button")].find(item => item.textContent?.trim() === label);
    if (!result) throw new Error("Missing button: " + label); return result;
  }
  async function click(element: HTMLElement) { await act(async () => element.click()); }
  const save = () => click(button(messages()["settings.telegramReminderSave"]));
  const tab = (id: string) => click(host.querySelector<HTMLElement>("#settings-tab-" + id)!);
  async function input(field: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setter.call(field, value); field.dispatchEvent(new Event("input", { bubbles: true })); });
  }
  it.each(["en", "fa"])("keeps a newly selected channel when saving fresh configuration in %s", async language => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language); await render();
    expect(remote.load).toHaveBeenCalledTimes(1);
    await click(radio("web_push")); expect(selected()).toBe("web_push");
    await input(chat(), "222"); await input(time(), "09:15"); await save();
    expect(stored).toMatchObject({ channel: "web_push", telegramChatId: "222", morningTime: "09:15" });
    expect(selected()).toBe("web_push"); expect(remote.save).toHaveBeenCalledTimes(2);
    expect(remote.test).not.toHaveBeenCalled(); expect(remote.subscribe).not.toHaveBeenCalled();
  });
  it.each(["en", "fa"])("keeps the latest saved configuration and an unfinished draft on channel changes in %s", async language => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language); await render();
    await input(chat(), "333"); await input(time(), "10:30"); await save();
    await input(chat(), "444"); await click(radio("web_push"));
    expect(stored).toMatchObject({ channel: "web_push", telegramChatId: "333", morningTime: "10:30" });
    expect(chat().value).toBe("444"); await save();
    expect(stored).toMatchObject({ channel: "web_push", telegramChatId: "444", morningTime: "10:30" });
  });
  it.each(["en", "fa"])("retains saved state and draft on failures and retries without leaking exceptions in %s", async language => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language); await render();
    remote.save.mockRejectedValueOnce(new Error("private backend detail"));
    await click(radio("web_push")); expect(selected()).toBe("telegram"); expect(stored.channel).toBe("telegram");
    expect(panel().querySelector('[role="alert"]')?.textContent).toBe(messages()["settings.telegramReminderSaveError"]);
    await click(radio("web_push")); await input(chat(), "555");
    remote.save.mockRejectedValueOnce(new Error("private backend detail")); await save();
    expect(chat().value).toBe("555"); expect(stored.telegramChatId).toBe("111");
    expect(panel().textContent).not.toContain("private backend detail"); expect(panel().textContent).not.toContain(messages()["settings.telegramReminderSaveSuccess"]);
    await save(); expect(stored).toMatchObject({ channel: "web_push", telegramChatId: "555" }); expect(panel().querySelector('[role="alert"]')).toBeNull();
  });
  it("retries a failed initial read without allowing a default overwrite", async () => {
    remote.load.mockRejectedValueOnce(new Error("private read")); await render();
    expect(button(messages()["settings.telegramReminderSave"]).disabled).toBe(true); expect(remote.save).not.toHaveBeenCalled();
    await click(button(messages()["common.tryAgain"])); expect(chat().value).toBe("111"); expect(remote.load).toHaveBeenCalledTimes(2);
  });
  it.each(["telegram", "web_push"])("retains legacy both until an explicit %s selection and commits a fresh Chat ID", async channel => {
    stored = { ...stored, channel: "both", telegramChatId: "" }; await render();
    expect(selected()).toBeUndefined(); expect(remote.save).not.toHaveBeenCalled();
    await input(chat(), "777"); radio(channel).focus();
    expect(remote.save).not.toHaveBeenCalled(); await click(radio(channel));
    expect(stored).toMatchObject({ channel, telegramChatId: "777" });
    expect(remote.save.mock.calls.every(([value]) => value.channel !== "both")).toBe(true);
    expect(selected()).toBe(channel);
  });
  it("serializes the form and selector while a persistence operation is pending", async () => {
    await render(); const pending = deferred<TelegramReminderPreference>(); remote.save.mockReturnValueOnce(pending.promise);
    await input(chat(), "888"); await save();
    expect(chat().disabled).toBe(true); expect(radio("web_push").disabled).toBe(true);
    await click(radio("web_push")); expect(remote.save).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ ...stored, telegramChatId: "888" }));
    expect(chat().disabled).toBe(false); await click(radio("web_push"));
    expect(remote.save).toHaveBeenLastCalledWith(expect.objectContaining({ channel: "web_push", telegramChatId: "888" }));
  });
  it.each(["load", "save"])("ignores an old account's pending %s after an authenticated account switch", async action => {
    const pending = deferred<TelegramReminderPreference>();
    if (action === "load") remote.load.mockReturnValueOnce(pending.promise);
    await render();
    if (action === "save") { await input(chat(), "999"); remote.save.mockReturnValueOnce(pending.promise); await save(); }
    remote.userId = "account-b"; stored = { ...stored, channel: "web_push", telegramChatId: "2222" }; await render();
    expect(chat().value).toBe("2222"); expect(selected()).toBe("web_push");
    await act(async () => pending.resolve({ ...stored, channel: "telegram", telegramChatId: "old-account" }));
    expect(chat().value).toBe("2222"); expect(selected()).toBe("web_push"); expect(remote.load).toHaveBeenCalledTimes(2);
  });
  it("does not initialize untouched destinations, retains drafts, and has just one visible Web Push poller", async () => {
    vi.useFakeTimers(); await render("/settings?tab=general");
    expect(remote.load).not.toHaveBeenCalled(); expect(registration).not.toHaveBeenCalled(); expect(remote.capabilities).not.toHaveBeenCalled();
    await tab("notifications"); expect(remote.load).toHaveBeenCalledTimes(1); expect(registration).toHaveBeenCalledTimes(1);
    await input(chat(), "draft"); await act(async () => { await vi.advanceTimersByTimeAsync(15000); }); expect(registration).toHaveBeenCalledTimes(4);
    await tab("general"); await act(async () => { await vi.advanceTimersByTimeAsync(15000); window.dispatchEvent(new Event("focus")); });
    expect(registration).toHaveBeenCalledTimes(4); expect(remote.load).toHaveBeenCalledTimes(1);
    await tab("notifications"); expect(chat().value).toBe("draft"); expect(registration).toHaveBeenCalledTimes(5); expect(remote.load).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); }); expect(registration).toHaveBeenCalledTimes(6);
  });
  it("discards a save completed while hidden and reloads authoritative values on return", async () => {
    await render(); await input(chat(), "555"); const pending = deferred<TelegramReminderPreference>(); remote.save.mockReturnValueOnce(pending.promise); await save();
    await tab("general"); stored = { ...stored, telegramChatId: "555" };
    await act(async () => pending.resolve(stored)); await tab("notifications");
    expect(remote.load).toHaveBeenCalledTimes(2); expect(chat().value).toBe("555"); expect(chat().disabled).toBe(false);
  });
  it("keeps the same form and unfinished draft through both language transitions without another preference read", async () => {
    await render(); const field = chat(); await input(field, "1212");
    await click(button("Use Persian")); expect(document.documentElement.dir).toBe("rtl"); expect(chat()).toBe(field); expect(field.value).toBe("1212");
    await click(button("Use English")); expect(document.documentElement.dir).toBe("ltr"); expect(chat()).toBe(field); expect(field.value).toBe("1212");
    expect(remote.load).toHaveBeenCalledTimes(1); expect(remote.save).not.toHaveBeenCalled();
  });
  it("updates channel availability immediately after explicit Web Push disable and re-enable without changing the saved channel", async () => {
    await render(); expect(radio("web_push").disabled).toBe(false);
    await click(button(messages()["settings.webPushReminderDisable"])); expect(radio("web_push").disabled).toBe(true);
    remote.subscribe.mockImplementation(async () => { subscription = { endpoint: "https://push.example.invalid/new" } as PushSubscription; return { status: "subscribed", subscription }; });
    await click(button(messages()["settings.webPushReminderEnable"])); expect(radio("web_push").disabled).toBe(false);
    expect(remote.save).not.toHaveBeenCalled(); expect(stored.channel).toBe("telegram"); expect(remote.register).toHaveBeenCalledTimes(1);
  });
  it.each(["en", "fa"])("preserves keyboard tab history and return focus in %s", async language => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language); await render();
    const trigger = host.querySelector<HTMLButtonElement>("#settings-tab-notifications")!;
    await act(async () => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: language === "fa" ? "ArrowLeft" : "ArrowRight", bubbles: true, cancelable: true })));
    expect(host.querySelector('[role="tab"][aria-selected="true"]')?.id).toBe("settings-tab-account");
    expect(document.activeElement?.id).toBe("settings-tab-account");
    await click(button("Browser back")); expect(panel().hidden).toBe(false); expect(document.activeElement).toBe(trigger);
    expect(remote.load).toHaveBeenCalledTimes(1);
  });
});
