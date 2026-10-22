// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, LANGUAGE_STORAGE_KEY, useI18n } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { TelegramReminderSettings } from "../components/TelegramReminderSettings";
import { WebPushReminderSettings } from "../components/WebPushReminderSettings";
const mocks = vi.hoisted(() => ({ load: vi.fn(), capabilities: vi.fn() }));
vi.mock("@/core/auth", () => ({ useAuthSession: () => ({ status: "authenticated", provider: "controlled", user: { userId: "controlled-user" } }) }));
vi.mock("@/core/sync", () => ({ getSupabaseSyncConfiguration: () => ({ url: "https://example.invalid" }) }));
vi.mock("../telegramReminderSettingsClient", () => ({ loadTelegramReminderPreference: mocks.load, saveTelegramReminderPreference: vi.fn(), sendTelegramReminderTest: vi.fn() }));
vi.mock("../webPushSubscription", () => ({ getWebPushCapabilities: mocks.capabilities, getWebPushPermissionState: () => "default", getVapidPublicKey: () => "", requestWebPushSubscription: vi.fn() }));
function Harness({ active }: { active: boolean }) {
  const { setLanguage } = useI18n();
  return <><button onClick={() => setLanguage("fa")}>Persian</button><TelegramReminderSettings active={active} /><WebPushReminderSettings active={active} /></>;
}
describe("Settings reminder visibility boundary (mocked authenticated session)", () => {
  let root: Root; let host: HTMLDivElement;
  beforeEach(async () => {
    await loadMessages("en"); await loadMessages("fa"); localStorage.clear(); window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en"); window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    mocks.load.mockReset().mockResolvedValue({ enabled: true, channel: "telegram", telegramChatId: "111", timezone: "UTC", morningTime: "08:00" });
    mocks.capabilities.mockReset().mockReturnValue({ supported: false });
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); localStorage.clear(); window.localStorage.clear(); });
  async function render(active: boolean) { await act(async () => root.render(<I18nProvider><Harness active={active} /></I18nProvider>)); }
  it("defers hidden effects and keeps a loaded Telegram draft across hiding, translation and revisiting", async () => {
    await render(false); expect(mocks.load).not.toHaveBeenCalled(); expect(mocks.capabilities).not.toHaveBeenCalled();
    await render(true); expect(mocks.load).toHaveBeenCalledTimes(1); expect(mocks.capabilities).toHaveBeenCalledTimes(1);
    const input = host.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setter.call(input, "222 draft"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    await render(false);
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(mocks.load).toHaveBeenCalledTimes(1); expect(mocks.capabilities).toHaveBeenCalledTimes(1);
    await render(true); expect(mocks.load).toHaveBeenCalledTimes(1); expect(input.value).toBe("222 draft"); expect(mocks.capabilities).toHaveBeenCalledTimes(2);
  });
  it("ignores a late hidden load and resumes the initial load when revisited", async () => {
    let resolve!: (value: unknown) => void;
    mocks.load.mockReset().mockReturnValueOnce(new Promise(done => { resolve = done; })).mockResolvedValue({ enabled: true, channel: "telegram", telegramChatId: "333", timezone: "UTC", morningTime: "08:00" });
    await render(true); await render(false);
    await act(async () => resolve({ enabled: true, channel: "telegram", telegramChatId: "late", timezone: "UTC", morningTime: "08:00" }));
    expect(host.querySelector<HTMLInputElement>('input[inputmode="numeric"]')?.value).not.toBe("late");
    await render(true); expect(mocks.load).toHaveBeenCalledTimes(2); expect(host.querySelector<HTMLInputElement>('input[inputmode="numeric"]')?.value).toBe("333");
  });
});
