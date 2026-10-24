// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountRuntimeState } from "@/core/account";
import { LOCAL_ONLY_ACCOUNT_RUNTIME_STATE } from "@/core/account/runtimeBoundary";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { SyncStatusCard } from "../components/SyncStatusCard";
import { TelegramReminderSettings } from "@/features/reminders/components/TelegramReminderSettings";

const controls = vi.hoisted(() => ({
  state: null as AccountRuntimeState | null,
  authStatus: "unauthenticated",
  loadTelegram: vi.fn(), saveTelegram: vi.fn(), sendTelegram: vi.fn(),
  syncNow: vi.fn(), snapshot: vi.fn(() => []), conflicts: vi.fn(async () => []),
  provider: { name: "email", isConfigured: () => true, login: vi.fn(), logout: vi.fn(), createAccount: vi.fn() },
}));
vi.mock("@/core/account", async original => ({
  ...await original<typeof import("@/core/account")>(),
  useAccountRuntime: () => ({ boundary: {
    syncNow: controls.syncNow, getSyncConflictSnapshot: controls.snapshot,
    getSyncConflicts: controls.conflicts, resolveSyncConflict: vi.fn(),
  } }),
  useAccountRuntimeState: () => controls.state!,
}));
vi.mock("@/core/auth", () => ({
  useAuth: () => ({ provider: controls.provider }),
  useAuthSession: () => ({ status: controls.authStatus, provider: "email", user: controls.authStatus === "authenticated" ? { userId: "qa-account" } : null }),
}));
vi.mock("@/core/sync", async original => ({
  ...await original<typeof import("@/core/sync")>(),
  getSupabaseSyncConfiguration: () => ({ url: "https://example.invalid", anonKey: "public-test-key" }),
}));
vi.mock("@/features/reminders/telegramReminderSettingsClient", () => ({
  loadTelegramReminderPreference: controls.loadTelegram,
  saveTelegramReminderPreference: controls.saveTelegram,
  sendTelegramReminderTest: controls.sendTelegram,
}));

describe("canonical Account and Sync UI", () => {
  let root: Root; let host: HTMLDivElement;
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en"); window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    controls.state = { ...LOCAL_ONLY_ACCOUNT_RUNTIME_STATE, accountProviderId: "email", accountStatus: "signed-out", localOnly: false };
    controls.authStatus = "unauthenticated";
    controls.loadTelegram.mockResolvedValue({ enabled: false, channel: "telegram", telegramChatId: "123", timezone: "UTC", morningTime: "08:00" });
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); host.remove(); vi.useRealTimers();
    localStorage.clear(); window.localStorage.clear();
  });
  async function render(active = true, notifications = false) {
    await act(async () => root.render(<I18nProvider>
      <SyncStatusCard active={active} onGoToBackupRestore={() => {}} />
      {notifications ? <TelegramReminderSettings /> : null}
    </I18nProvider>));
  }
  function trigger(id = "account-sync-advanced-panel-loader") {
    const button = host.querySelector<HTMLButtonElement>(`#${id} > button`);
    if (!button) throw new Error(`Missing disclosure ${id}`);
    return button;
  }
  async function expand() {
    await act(async () => { trigger().click(); });
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(host.querySelector("#account-sync-advanced-details")).not.toBeNull();
  }
  const selectedButtons = (label: string) => [...host.querySelectorAll("button")].filter(button => button.textContent?.trim() === label);

  it.each(["en", "fa"] as const)("keeps one canonical email form and action group after expansion in %s", async language => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language); window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await render();
    const email = host.querySelector<HTMLInputElement>('input[type="email"]')!;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { set.call(email, "draft@example.invalid"); email.dispatchEvent(new Event("input", { bubbles: true })); });
    await expand();
    const messages = language === "en" ? messagesEn : messagesFa;
    expect(host.querySelectorAll('input[type="email"]')).toHaveLength(1);
    expect(host.querySelectorAll('input[type="password"]')).toHaveLength(1);
    expect(selectedButtons(messages["settings.accountCreateAction"])).toHaveLength(1);
    expect(selectedButtons(messages["settings.accountEmailSignInAction"])).toHaveLength(1);
    expect(host.querySelector('input[type="email"]')).toBe(email);
    expect(email.value).toBe("draft@example.invalid");
    expect(controls.loadTelegram).not.toHaveBeenCalled();
    expect(controls.syncNow).not.toHaveBeenCalled();
  });

  it("does not initialize Telegram in Account, and leaves Notifications as the canonical configuration", async () => {
    controls.authStatus = "authenticated";
    await render(); await expand();
    expect(controls.loadTelegram).not.toHaveBeenCalled();
    expect(host.querySelector('input[inputmode="numeric"]')).toBeNull();
    await render(false, true);
    expect(controls.loadTelegram).toHaveBeenCalledTimes(1);
    expect(host.querySelector('input[inputmode="numeric"]')).not.toBeNull();
    expect(controls.saveTelegram).not.toHaveBeenCalled();
    expect(controls.sendTelegram).not.toHaveBeenCalled();
  });

  it("retains nested disclosure state and DOM identity across collapse and inactive revisits without network work", async () => {
    await render(); await expand();
    const nested = trigger("account-sync-advanced-details");
    await act(async () => nested.click());
    expect(nested.getAttribute("aria-expanded")).toBe("true");
    await act(async () => trigger().click());
    expect(host.querySelector<HTMLElement>("#account-sync-advanced-panel-loader-content")?.hidden).toBe(true);
    expect(nested.isConnected).toBe(true);
    await render(false);
    vi.useFakeTimers();
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); window.dispatchEvent(new Event("focus")); });
    await render(true);
    await act(async () => trigger().click());
    expect(trigger("account-sync-advanced-details")).toBe(nested);
    expect(nested.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).not.toBe(nested);
    expect(controls.conflicts).not.toHaveBeenCalled();
    expect(controls.syncNow).not.toHaveBeenCalled();
    expect(controls.loadTelegram).not.toHaveBeenCalled();
  });

  it("does not mount the advanced subtree while inactive before its first expansion", async () => {
    await render(false);
    await act(async () => trigger().click());
    expect(host.querySelector("#account-sync-advanced-details")).toBeNull();
    await render(true);
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(host.querySelector("#account-sync-advanced-details")).not.toBeNull();
  });

  it("resets retained advanced state on account changes and sign-out", async () => {
    const identity = { accountId: "account-a", providerId: "email", email: "a@example.invalid" };
    controls.state = { ...controls.state!, hasActiveAccount: true, accountStatus: "authenticated", identity };
    await render(); await expand();
    const nested = trigger("account-sync-advanced-details");
    await act(async () => nested.click());
    expect(selectedButtons(messagesEn["settings.accountSignOutAction"])).toHaveLength(1);
    controls.state = { ...controls.state!, identity: { ...identity, accountId: "account-b" } };
    await render();
    expect(nested.isConnected).toBe(false);
    const next = trigger("account-sync-advanced-details");
    expect(next.getAttribute("aria-expanded")).toBe("false");
    controls.state = { ...controls.state!, hasActiveAccount: false, identity: null, accountStatus: "signed-out" };
    await render();
    expect(next.isConnected).toBe(false);
    expect(host.querySelectorAll('input[type="email"]')).toHaveLength(1);
    expect(controls.syncNow).not.toHaveBeenCalled();
    expect(controls.conflicts).not.toHaveBeenCalled();
  });
});
