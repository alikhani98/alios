// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import type { TelegramReminderPreference, TelegramReminderPreferenceInput } from "@/features/reminders/telegramReminderSettings";
import { validateTelegramReminderPreference } from "@/features/reminders/telegramReminderSettings";
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


describe("bilingual Settings safety copy", () => {
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
  async function render(language: "en" | "fa", tab: string) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await act(async () => root.render(<MemoryRouter initialEntries={["/settings?tab=" + tab]}><I18nProvider><DateDisplayProvider><SettingsPage /></DateDisplayProvider></I18nProvider></MemoryRouter>));
  }
  const catalog = (language: "en" | "fa") => language === "fa" ? messagesFa : messagesEn;
  function button(label: string) {
    const result = [...host.querySelectorAll("button")].find(item => item.textContent?.trim() === label);
    if (!result) throw new Error("Missing button: " + label); return result;
  }
  async function click(element: HTMLElement) { await act(async () => element.click()); }
  async function setChat(value: string) {
    const field = host.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setter.call(field, value); field.dispatchEvent(new Event("input", { bubbles: true })); });
  }
  it.each(["en", "fa"] as const)("shows the deletion boundary and separate attachment backup advice before any destructive action in %s", async language => {
    await render(language, "data"); const warning = catalog(language)["settings.clearWarning"];
    const danger = host.querySelector("#settings-clear-data")!;
    expect(danger.textContent).toContain(warning);
    const claims = language === "en" ? [
      "local database in this browser", "therapy notes", "attachment records and their stored contents", "pending sync changes",
      "Browser preferences (including language) and account/session details are kept",
      "Cloud records, exported backups and files outside this browser’s AliOS storage are not deleted",
      "a JSON backup and an attachment package", "This action has no Undo",
    ] : [
      "پایگاه دادهٔ محلی AliOS در این مرورگر", "یادداشت‌های تراپی", "اطلاعات و محتوای ذخیره‌شدهٔ پیوست‌ها", "تغییرات در انتظار همگام‌سازی",
      "ترجیحات مرورگر، از جمله زبان، و اطلاعات حساب و نشست ورود حفظ می‌شوند",
      "داده‌های ابری، پشتیبان‌های صادرشده و فایل‌های خارج از فضای ذخیره‌سازی AliOS در این مرورگر حذف نمی‌شوند",
      "پشتیبان JSON و بستهٔ پیوست‌ها", "گزینهٔ «واگرد» ندارد",
    ];
    for (const claim of claims) expect(warning).toContain(claim);
    expect(document.documentElement.lang).toBe(language);
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
    expect(actions.confirmClear).not.toHaveBeenCalled(); expect(remote.save).not.toHaveBeenCalled();
  });
  it.each(["en", "fa"] as const)("uses the localized channel and conditional Chat ID messages for actual validation and form saves in %s", async language => {
    const messages = catalog(language);
    // @ts-expect-error Invalid persisted input must still produce a supported-channel validation message.
    const invalid = validateTelegramReminderPreference({ ...stored, channel: "unsupported" });
    expect(invalid).toBe("settings.telegramReminderChannelValidation");
    expect(messages[invalid! as "settings.telegramReminderChannelValidation"]).toBe(language === "en"
      ? "Choose Telegram or Web Push as the delivery channel." : "تلگرام یا Web Push را به‌عنوان کانال ارسال انتخاب کنید.");
    expect(validateTelegramReminderPreference({ ...stored, channel: "web_push", telegramChatId: "" })).toBeNull();
    expect(validateTelegramReminderPreference({ ...stored, channel: "telegram", enabled: false, telegramChatId: "" })).toBeNull();
    await render(language, "notifications"); await setChat("");
    expect(host.textContent).toContain(messages["settings.telegramReminderChatIdRequired"]);
    expect(messages["settings.telegramReminderChatIdRequired"]).toContain(language === "en" ? "enabled and Telegram" : "فعال‌اند و کانال انتخاب‌شده تلگرام");
    await click(host.querySelector<HTMLButtonElement>('[data-channel="web_push"]')!);
    expect(host.textContent).not.toContain(messages["settings.telegramReminderChatIdRequired"]);
    await click(button(messages["settings.telegramReminderSave"]));
    expect(stored).toMatchObject({ channel: "web_push", telegramChatId: "" });
    expect(host.querySelector('#settings-panel-notifications [role="status"]')?.textContent).toBe(messages["settings.telegramReminderSaveSuccess"]);
    expect(messages["settings.telegramReminderSaveSuccess"]).toContain(language === "en" ? "Delivery has not been verified" : "تحویل اعلان تأیید نشده");
    expect(host.textContent).toContain(messages["settings.telegramReminderMorningTimeHelp"]);
    expect(messages["settings.telegramReminderMorningTimeHelp"]).toContain(language === "en" ? "does not guarantee delivery" : "تحویل را تضمین نمی‌کند");
    expect(remote.test).not.toHaveBeenCalled(); expect(remote.subscribe).not.toHaveBeenCalled();
  });
  it.each(["en", "fa"] as const)("explains legacy both and the visible-form save exception before an explicit choice in %s", async language => {
    stored = { ...stored, channel: "both" }; await render(language, "notifications");
    const message = catalog(language)["reminders.channelSelector.legacyBoth"];
    expect(host.textContent).toContain(message);
    expect(message).toContain(language === "en" ? "also saves the configuration currently shown" : "تنظیمات فعلیِ نمایش‌داده‌شده در فرم را هم ذخیره می‌کند");
    expect(message).toContain(language === "en" ? "scheduler skips “both”" : "زمان‌بند از «both» برای ارسال استفاده نمی‌کند");
    expect(host.querySelector('[role="radio"][aria-checked="true"]')).toBeNull();
    expect(remote.save).not.toHaveBeenCalled(); expect(remote.test).not.toHaveBeenCalled();
  });
  it.each(["en", "fa"] as const)("reports explicit Push registration separately from delivery and preference saving in %s", async language => {
    await render(language, "notifications"); const messages = catalog(language);
    expect(host.textContent).toContain(messages["settings.webPushDeliveryUnverified"]);
    expect(host.textContent).not.toContain(messages["settings.webPushReminderStatusSubscribed"]);
    remote.subscribe.mockResolvedValue({ status: "subscribed", subscription: { endpoint: "https://push.example.invalid/fixture", p256dh: "public-test", auth: "public-test" } });
    await click(button(messages["settings.webPushReminderEnable"]));
    expect(remote.register).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain(messages["settings.webPushReminderStatusSubscribed"]);
    expect(host.textContent).toContain(messages["settings.webPushReminderEnableSuccess"]);
    expect(messages["settings.webPushReminderEnableSuccess"]).toContain(language === "en" ? "does not confirm notification delivery" : "به معنی تأیید تحویل اعلان نیست");
    expect(remote.save).not.toHaveBeenCalled(); expect(remote.test).not.toHaveBeenCalled();
  });
});
