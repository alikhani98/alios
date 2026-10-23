// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { ReminderChannelSelector } from "../components/ReminderChannelSelector";
import { TelegramReminderSettings } from "../components/TelegramReminderSettings";
import { WebPushReminderSettings } from "../components/WebPushReminderSettings";
import type { TelegramReminderPreference, TelegramReminderPreferenceInput } from "../telegramReminderSettings";
import type { WebPushSubscriptionResult } from "../webPushSubscription";
import { useTelegramReminderSettings, type TelegramReminderSettingsController } from "../useTelegramReminderSettings";

const mocks = vi.hoisted(() => ({
  load: vi.fn(), save: vi.fn(), test: vi.fn(), subscribe: vi.fn(), register: vi.fn(), remove: vi.fn(),
  session: { status: "authenticated", provider: "email", user: { userId: "test-user" } },
  permission: "granted" as "granted" | "denied" | "default",
  supported: true,
}));
vi.mock("@/core/auth", () => ({ useAuthSession: () => mocks.session }));
vi.mock("@/core/sync", () => ({ getSupabaseSyncConfiguration: () => ({ url: "https://example.invalid", anonKey: "public-test-key" }) }));
vi.mock("../telegramReminderSettingsClient", () => ({
  loadTelegramReminderPreference: mocks.load,
  saveTelegramReminderPreference: mocks.save,
  sendTelegramReminderTest: mocks.test,
}));
vi.mock("../webPushSubscription", () => ({
  getVapidPublicKey: () => "public-test-vapid-key",
  getWebPushCapabilities: () => ({ supported: mocks.supported }),
  getWebPushPermissionState: () => mocks.permission,
  requestWebPushSubscription: mocks.subscribe,
}));
vi.mock("../webPushSubscriptionClient", () => ({
  registerWebPushSubscription: mocks.register,
  deleteWebPushSubscription: mocks.remove,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

describe("notification settings integrity", () => {
  let container: HTMLDivElement;
  let root: Root;
  let persisted: TelegramReminderPreference;
  let controller: TelegramReminderSettingsController;

  function SharedForms({ active = true }: { active?: boolean } = {}) {
    const settings = useTelegramReminderSettings(active);
    controller = settings;
    return <>
      <output data-channel>{settings.preference?.channel ?? "loading"}</output>
      <section data-form="notifications"><TelegramReminderSettings settings={settings} active={active} /></section>
      <section data-form="account"><TelegramReminderSettings settings={settings} active={active} /></section>
      <ReminderChannelSelector currentChannel={settings.preference?.channel ?? "telegram"}
        hasTelegram={Boolean(settings.preference?.telegramChatId)} hasWebPush
        disabled={!settings.preference || settings.isBusy} onChannelChange={settings.changeChannel} />
    </>;
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    mocks.session.status = "authenticated";
    mocks.session.user.userId = "test-user";
    mocks.permission = "granted";
    mocks.supported = true;
    persisted = { enabled: true, channel: "web_push", telegramChatId: "12345", timezone: "Asia/Tehran", morningTime: "08:00" };
    mocks.load.mockImplementation(async () => ({ ...persisted }));
    mocks.save.mockImplementation(async (input: TelegramReminderPreferenceInput) => {
      persisted = { ...input };
      return { ...persisted };
    });
    await loadMessages("en");
    await loadMessages("fa");
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  async function render(content = <SharedForms />) {
    await act(async () => root.render(<I18nProvider>{content}</I18nProvider>));
  }
  function form(name = "notifications") {
    const element = container.querySelector<HTMLElement>(`[data-form="${name}"]`);
    if (!element) throw new Error("Missing form: " + name);
    return element;
  }
  function button(label: string, scope: ParentNode = container) {
    const element = Array.from(scope.querySelectorAll("button")).find((entry) => entry.textContent?.trim() === label);
    if (!element) throw new Error("Missing button: " + label);
    return element;
  }
  function time(name = "notifications") {
    const element = form(name).querySelector<HTMLInputElement>('input[type="time"]');
    if (!element) throw new Error("Missing time input");
    return element;
  }
  async function changeTime(value: string, name = "notifications") {
    const input = time(name);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("Missing input setter");
    await act(async () => {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  async function click(element: HTMLElement) { await act(async () => element.click()); }


  it("does not start remote actions while inactive and retains the loaded draft on return", async () => {
    await render(<SharedForms active={false} />);
    expect(mocks.load).not.toHaveBeenCalled();
    await act(async () => {
      await controller.saveSettings();
      await controller.changeChannel("telegram");
      await controller.sendTest();
      controller.retry();
    });
    expect(mocks.load).not.toHaveBeenCalled();
    await render();
    await changeTime("10:45");
    await render(<SharedForms active={false} />);
    await act(async () => {
      controller.setField("morningTime", "11:30");
      await controller.saveSettings();
      await controller.changeChannel("telegram");
      await controller.sendTest();
      controller.retry();
    });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.test).not.toHaveBeenCalled();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    await render();
    expect(time().value).toBe("10:45");
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });

  it.each(["telegram", "web_push"] as const)("preserves the %s selection when either Telegram form saves and restores both forms after remount", async (channel) => {
    persisted = { ...persisted, channel };
    await render();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.save).not.toHaveBeenCalled();
    await changeTime("09:15");
    expect(time("account").value).toBe("09:15");
    await click(button(messagesEn["settings.telegramReminderSave"], form("account")));
    expect(mocks.save).toHaveBeenLastCalledWith({ ...persisted, channel, morningTime: "09:15" });
    expect(container.querySelector("[data-channel]")?.textContent).toBe(channel);
    expect(persisted.enabled).toBe(true);
    expect(persisted.telegramChatId).toBe("12345");
    expect(persisted.timezone).toBe("Asia/Tehran");
    expect(mocks.subscribe).not.toHaveBeenCalled();
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.test).not.toHaveBeenCalled();
    await act(async () => root.render(null));
    await render();
    expect(time().value).toBe("09:15");
    expect(time("account").value).toBe("09:15");
    expect(container.querySelector("[data-channel]")?.textContent).toBe(channel);
  });

  it("preserves legacy both on load and remount without selecting or saving a channel", async () => {
    persisted = { ...persisted, channel: "both" };
    await render();
    expect(container.querySelector("[data-channel]")?.textContent).toBe("both");
    expect(container.querySelector('[role="radio"][aria-checked="true"]')).toBeNull();
    expect(container.textContent).toContain(messagesEn["reminders.channelSelector.legacyBoth"]);
    expect(button(messagesEn["settings.telegramReminderSave"], form()).disabled).toBe(true);
    await act(async () => { await controller.saveSettings(); });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.subscribe).not.toHaveBeenCalled();
    expect(mocks.test).not.toHaveBeenCalled();
    await act(async () => root.render(null));
    await render();
    expect(container.querySelector("[data-channel]")?.textContent).toBe("both");
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each(["telegram", "web_push"] as const)("replaces legacy both with %s only after explicit selection, retaining the visible configuration", async (channel) => {
    persisted = { ...persisted, channel: "both" };
    await render();
    await changeTime("09:45");
    await click(button(channel === "telegram" ? "Telegram" : "Web Push"));
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(persisted).toEqual({ enabled: true, channel, telegramChatId: "12345", timezone: "Asia/Tehran", morningTime: "09:45" });
    expect(time("account").value).toBe("09:45");
    await act(async () => root.render(null));
    await render();
    expect(container.querySelector("[data-channel]")?.textContent).toBe(channel);
    expect(container.textContent).not.toContain(messagesEn["reminders.channelSelector.legacyBoth"]);
  });

  it("preserves both and its configuration when explicit replacement fails, and permits retry", async () => {
    persisted = { ...persisted, channel: "both" };
    mocks.save.mockRejectedValueOnce(new Error("save failed"));
    await render();
    await click(button("Telegram"));
    expect(persisted.channel).toBe("both");
    expect(container.querySelector('[role="radio"][aria-checked="true"]')).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.telegramReminderSaveError"]);
    await click(button("Telegram"));
    expect(persisted.channel).toBe("telegram");
  });

  it("can resolve both after entering a required Chat ID without silently dropping the configuration", async () => {
    persisted = { ...persisted, channel: "both", telegramChatId: "" };
    await render();
    await click(button("Telegram"));
    expect(mocks.save).not.toHaveBeenCalled();
    const input = form().querySelector<HTMLInputElement>('input[inputmode="numeric"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!input || !setter) throw new Error("Missing Chat ID input");
    await act(async () => { setter.call(input, "24680"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    await click(button("Telegram"));
    expect(persisted).toMatchObject({ channel: "telegram", telegramChatId: "24680", enabled: true });
  });

  it("only changes channel through the selector and preserves an unfinished configuration draft", async () => {
    persisted = { ...persisted, channel: "telegram" };
    await render();
    await changeTime("10:30");
    await click(button("Web Push"));
    expect(persisted.channel).toBe("web_push");
    expect(persisted.morningTime).toBe("08:00");
    expect(time().value).toBe("10:30");
    expect(time("account").value).toBe("10:30");
    await click(button(messagesEn["settings.telegramReminderSave"], form()));
    expect(persisted.channel).toBe("web_push");
    expect(persisted.morningTime).toBe("10:30");
    expect(container.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("Web Push");
  });

  it("allows explicit Web Push selection without requiring a Telegram chat ID", async () => {
    persisted = { ...persisted, channel: "telegram", enabled: false, telegramChatId: "" };
    await render();
    expect(button("Telegram").disabled).toBe(true);
    expect(button("Web Push").disabled).toBe(false);
    await click(button("Web Push"));
    expect(persisted).toMatchObject({ channel: "web_push", enabled: false, telegramChatId: "" });
  });

  it.each(["en", "fa"] as const)("shows a localized failed save in %s without false success or raw server errors, and permits retry", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "fa" ? messagesFa : messagesEn;
    mocks.save.mockRejectedValueOnce(new Error("private server detail"));
    await render();
    await changeTime("09:00");
    await click(button(messages["settings.telegramReminderSave"], form()));
    expect(form().querySelector('[role="alert"]')?.textContent).toBe(messages["settings.telegramReminderSaveError"]);
    expect(form("account").querySelector('[role="alert"]')?.textContent).toBe(messages["settings.telegramReminderSaveError"]);
    expect(container.textContent).not.toContain("private server detail");
    expect(container.textContent).not.toContain(messages["settings.telegramReminderSaveSuccess"]);
    expect(persisted.morningTime).toBe("08:00");
    expect(time().value).toBe("09:00");
    await click(button(messages["settings.telegramReminderSave"], form("account")));
    expect(persisted.morningTime).toBe("09:00");
    expect(form().querySelector('[role="status"]')?.textContent).toBe(messages["settings.telegramReminderSaveSuccess"]);
  });

  it("blocks both forms and selector during a save, including submissions before React rerenders", async () => {
    const save = deferred<TelegramReminderPreference>();
    mocks.save.mockReturnValueOnce(save.promise);
    await render();
    await changeTime("11:00");
    let first!: Promise<void>;
    await act(async () => {
      first = controller.saveSettings();
      void controller.saveSettings();
      void controller.changeChannel("telegram");
    });
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(form("account").querySelector<HTMLInputElement>('input[type="time"]')?.disabled).toBe(true);
    expect(Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')).every((entry) => entry.disabled)).toBe(true);
    await act(async () => { save.resolve({ ...persisted, morningTime: "11:00" }); await first; });
    expect(time().value).toBe("11:00");
  });

  it("does not write unchanged preferences and does not request permission or send tests during initialization", async () => {
    await render();
    await click(button(messagesEn["settings.telegramReminderSave"], form()));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.subscribe).not.toHaveBeenCalled();
    expect(mocks.test).not.toHaveBeenCalled();
  });

  it("only sends a test after an explicit action, prevents duplicate sends, and preserves the selected channel", async () => {
    const delivery = deferred<string>();
    mocks.test.mockReturnValueOnce(delivery.promise);
    await render();
    let pending!: Promise<void>;
    await act(async () => { pending = controller.sendTest(); void controller.sendTest(); });
    expect(mocks.test).toHaveBeenCalledTimes(1);
    expect(mocks.test).toHaveBeenCalledWith("12345");
    expect(mocks.save).not.toHaveBeenCalled();
    await act(async () => { delivery.resolve("server response"); await pending; });
    expect(container.querySelector("[data-channel]")?.textContent).toBe("web_push");
    expect(form().querySelector('[role="status"]')?.textContent).toBe(messagesEn["settings.telegramReminderTestSuccess"]);
    expect(container.textContent).not.toContain("server response");
  });

  it("requires a successful read before saving and retries without overwriting server values", async () => {
    mocks.load.mockRejectedValueOnce(new Error("private load detail"));
    await render();
    expect(button(messagesEn["settings.telegramReminderSave"], form()).disabled).toBe(true);
    expect(form().querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.telegramReminderLoadError"]);
    await click(button(messagesEn["common.tryAgain"], form("account")));
    expect(time().value).toBe("08:00");
    expect(container.querySelector("[data-channel]")?.textContent).toBe("web_push");
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("keeps the previous channel on failed selection and does not persist unfinished fields", async () => {
    await render();
    await changeTime("12:00");
    mocks.save.mockRejectedValueOnce(new Error("failed"));
    await click(button("Telegram"));
    expect(container.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("Web Push");
    expect(mocks.save).toHaveBeenCalledWith({ ...persisted, channel: "telegram" });
    expect(time().value).toBe("12:00");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.telegramReminderSaveError"]);
  });

  it("ignores a pending save after the account changes", async () => {
    const save = deferred<TelegramReminderPreference>();
    mocks.save.mockReturnValueOnce(save.promise);
    await render();
    await changeTime("13:00");
    let pending!: Promise<void>;
    await act(async () => { pending = controller.saveSettings(); });
    mocks.session.user.userId = "other-user";
    persisted = { ...persisted, morningTime: "06:00", telegramChatId: "67890" };
    await render();
    await act(async () => { save.resolve({ ...persisted, morningTime: "13:00" }); await pending; });
    expect(time().value).toBe("06:00");
    expect(container.textContent).not.toContain(messagesEn["settings.telegramReminderSaveSuccess"]);
  });

  it.each(["en", "fa"] as const)("moves focus and the persisted selection with arrows in %s while retaining one Tab stop", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    persisted = { ...persisted, channel: "telegram" };
    await render();
    const radios = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const group = container.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute("dir")).toBe(language === "fa" ? "rtl" : "ltr");
    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1]);
    radios[0].focus();
    expect(mocks.save).not.toHaveBeenCalled();
    for (const key of [language === "fa" ? "ArrowLeft" : "ArrowRight", "ArrowDown", "ArrowUp", language === "fa" ? "ArrowRight" : "ArrowLeft"]) {
      const previous = persisted.channel;
      const active = document.activeElement!;
      await act(async () => active.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
      const next = previous === "telegram" ? "web_push" : "telegram";
      expect(persisted.channel).toBe(next);
      const selected = container.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]')!;
      expect(document.activeElement).toBe(selected);
      expect(selected.tabIndex).toBe(0);
      expect(radios.filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
    }
    const calls = mocks.save.mock.calls.length;
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    await act(async () => document.activeElement!.dispatchEvent(tab));
    expect(tab.defaultPrevented).toBe(false);
    expect(mocks.save).toHaveBeenCalledTimes(calls);
  });

  it("keeps legacy both on focus and Tab, but replaces it after an explicit arrow selection", async () => {
    persisted = { ...persisted, channel: "both" };
    await render();
    const first = container.querySelector<HTMLButtonElement>('[role="radio"][tabindex="0"]')!;
    await act(async () => { first.focus(); first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })); });
    expect(persisted.channel).toBe("both");
    expect(mocks.save).not.toHaveBeenCalled();
    expect(container.querySelector('[role="radio"][aria-checked="true"]')).toBeNull();
    await act(async () => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })));
    expect(persisted.channel).toBe("web_push");
    expect(document.activeElement).toBe(container.querySelector('[role="radio"][aria-checked="true"]'));
  });

  it("restores focus to the saved channel after failed keyboard selection and retries", async () => {
    persisted = { ...persisted, channel: "telegram" };
    mocks.save.mockRejectedValueOnce(new Error("private channel detail"));
    await render();
    const first = container.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]')!;
    first.focus();
    await act(async () => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true })));
    expect(persisted.channel).toBe("telegram");
    expect(first.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(first);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.telegramReminderSaveError"]);
    expect(container.textContent).not.toContain("private channel detail");
    await act(async () => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true })));
    expect(persisted.channel).toBe("web_push");
    expect(document.activeElement).toBe(container.querySelector('[role="radio"][aria-checked="true"]'));
  });

  it("skips unavailable channels and does not submit on focus or unrelated keys", async () => {
    const change = vi.fn(async () => undefined);
    await render(<ReminderChannelSelector currentChannel="web_push" hasTelegram={false} hasWebPush onChannelChange={change} />);
    const radios = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(radios[0].disabled).toBe(true);
    expect(radios.map((radio) => radio.tabIndex)).toEqual([-1, 0]);
    radios[1].focus();
    for (const key of ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Escape", "a"]) {
      await act(async () => radios[1].dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
      expect(document.activeElement).toBe(radios[1]);
    }
    expect(change).not.toHaveBeenCalled();
  });

  it("serializes keyboard changes while persistence is pending", async () => {
    persisted = { ...persisted, channel: "telegram" };
    const save = deferred<TelegramReminderPreference>();
    mocks.save.mockReturnValueOnce(save.promise);
    await render();
    const radios = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    radios[0].focus();
    await act(async () => {
      radios[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
      radios[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
      radios[1].click();
    });
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="radiogroup"]')?.getAttribute("aria-busy")).toBe("true");
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    await act(async () => { persisted = { ...persisted, channel: "web_push" }; save.resolve(persisted); await save.promise; });
    expect(document.activeElement).toBe(radios[1]);
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
  });

  describe("Web Push device state", () => {
    const capabilities = { supported: true, notification: true, serviceWorker: true, pushManager: true };
    let subscription: { endpoint: string; unsubscribe: ReturnType<typeof vi.fn> } | null;
    const availability = vi.fn();

    beforeEach(() => {
      subscription = { endpoint: "https://push.example.invalid/test", unsubscribe: vi.fn(async () => true) };
      vi.stubGlobal("PushManager", class {});
      vi.stubGlobal("navigator", { serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => subscription } }) } });
      mocks.subscribe.mockImplementation(async () => {
        subscription ??= { endpoint: "https://push.example.invalid/test", unsubscribe: vi.fn(async () => true) };
        return { status: "subscribed", capabilities, subscription: { endpoint: subscription.endpoint, p256dh: "test", auth: "test", user_agent: null } };
      });
      mocks.register.mockResolvedValue({ ok: true });
      mocks.remove.mockResolvedValue({ ok: true });
    });

    it("distinguishes permission and an existing browser subscription from server registration, without implicit operations", async () => {
      await render(<WebPushReminderSettings onSubscriptionChange={availability} />);
      expect(container.textContent).toContain(messagesEn["settings.webPushPermissionGranted"]);
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderStatusUnverified"]);
      expect(container.textContent).toContain(messagesEn["settings.webPushDeliveryUnverified"]);
      expect(availability).toHaveBeenLastCalledWith(true);
      expect(mocks.subscribe).not.toHaveBeenCalled();
      expect(mocks.register).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
    });

    it("does not treat granted permission without a subscription as subscribed", async () => {
      subscription = null;
      await render(<WebPushReminderSettings onSubscriptionChange={availability} />);
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderStatusNotSubscribed"]);
      expect(availability).toHaveBeenLastCalledWith(false);
      expect(mocks.subscribe).not.toHaveBeenCalled();
    });

    it("keeps denied permission separate and never requests a subscription on mount", async () => {
      mocks.permission = "denied";
      await render(<WebPushReminderSettings onSubscriptionChange={availability} />);
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderStatusPermissionDenied"]);
      expect(button(messagesEn["settings.webPushReminderEnable"]).disabled).toBe(true);
      expect(availability).toHaveBeenLastCalledWith(false);
      expect(mocks.subscribe).not.toHaveBeenCalled();
    });

    it("handles a dismissed permission request without registering or changing preferences", async () => {
      subscription = null;
      mocks.permission = "default";
      mocks.subscribe.mockResolvedValueOnce({ status: "permission-default", permission: "default", capabilities });
      await render(<WebPushReminderSettings onSubscriptionChange={availability} />);
      await click(button(messagesEn["settings.webPushReminderEnable"]));
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderPermissionDefaultHelp"]);
      expect(mocks.register).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
      expect(availability).toHaveBeenLastCalledWith(false);
    });

    it("shows unsupported browsers without invoking permission or subscription APIs", async () => {
      mocks.supported = false;
      await render(<WebPushReminderSettings onSubscriptionChange={availability} />);
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderStatusNotSupported"]);
      expect(button(messagesEn["settings.webPushReminderEnable"]).disabled).toBe(true);
      expect(mocks.subscribe).not.toHaveBeenCalled();
      expect(availability).toHaveBeenLastCalledWith(false);
    });

    it.each(["unsupported", "permission-denied", "permission-default"] as const)(
      "does not register or confirm a subscription for a %s result", async (status) => {
        subscription = null;
        mocks.permission = "default";
        const result: WebPushSubscriptionResult = status === "unsupported"
          ? { status, capabilities }
          : { status, permission: status === "permission-denied" ? "denied" : "default", capabilities };
        mocks.subscribe.mockResolvedValueOnce(result);
        await render(<WebPushReminderSettings />);
        await click(button(messagesEn["settings.webPushReminderEnable"]));
        expect(mocks.subscribe).toHaveBeenCalledTimes(1);
        expect(mocks.register).not.toHaveBeenCalled();
        expect(mocks.save).not.toHaveBeenCalled();
        expect(container.textContent).not.toContain(messagesEn["settings.webPushReminderStatusSubscribed"]);
        expect(container.textContent).not.toContain(messagesEn["settings.webPushReminderEnableSuccess"]);
        const help = {
          unsupported: messagesEn["settings.webPushReminderNotSupportedHelp"],
          "permission-denied": messagesEn["settings.webPushReminderPermissionDeniedHelp"],
          "permission-default": messagesEn["settings.webPushReminderPermissionDefaultHelp"],
        };
        expect(container.textContent).toContain(help[status]);
      });

    it("reports registration failure without success, retries the existing subscription, and never changes the channel", async () => {
      mocks.register.mockRejectedValueOnce(new Error("private push detail"));
      await render(<WebPushReminderSettings />);
      await click(button(messagesEn["settings.webPushReminderEnable"]));
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.webPushReminderEnableError"]);
      expect(container.textContent).not.toContain("private push detail");
      expect(container.textContent).not.toContain(messagesEn["settings.webPushReminderEnableSuccess"]);
      await click(button(messagesEn["settings.webPushReminderEnable"]));
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderStatusSubscribed"]);
      expect(mocks.save).not.toHaveBeenCalled();
      await act(async () => root.render(null));
      await render(<WebPushReminderSettings />);
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderStatusUnverified"]);
    });

    it("prevents duplicate registration while the explicit enable operation is pending", async () => {
      const registration = deferred<{ ok: boolean }>();
      mocks.register.mockReturnValueOnce(registration.promise);
      await render(<WebPushReminderSettings />);
      const enable = button(messagesEn["settings.webPushReminderEnable"]);
      await act(async () => { enable.click(); enable.click(); });
      expect(mocks.subscribe).toHaveBeenCalledTimes(1);
      expect(mocks.register).toHaveBeenCalledTimes(1);
      await act(async () => { registration.resolve({ ok: true }); await registration.promise; });
    });

    it("does not report successful disable when the browser subscription remains active", async () => {
      subscription?.unsubscribe.mockResolvedValue(false);
      await render(<WebPushReminderSettings />);
      await click(button(messagesEn["settings.webPushReminderDisable"]));
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(messagesEn["settings.webPushReminderDisableError"]);
      expect(container.textContent).not.toContain(messagesEn["settings.webPushReminderDisableSuccess"]);
      expect(mocks.save).not.toHaveBeenCalled();
    });

    it("updates availability after explicit unsubscribe without changing saved channel preferences", async () => {
      subscription?.unsubscribe.mockImplementation(async () => { subscription = null; return true; });
      await render(<WebPushReminderSettings onSubscriptionChange={availability} />);
      await click(button(messagesEn["settings.webPushReminderDisable"]));
      expect(container.textContent).toContain(messagesEn["settings.webPushReminderDisableSuccess"]);
      expect(availability).toHaveBeenLastCalledWith(false);
      expect(mocks.remove).toHaveBeenCalledTimes(1);
      expect(mocks.save).not.toHaveBeenCalled();
    });
  });
});
