import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/core/auth";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { TelegramReminderSettings } from "../components/TelegramReminderSettings";
import {
  getTelegramReminderTimeZoneOptions,
  validateTelegramReminderPreference,
} from "../telegramReminderSettings";

const mocks = vi.hoisted(() => ({ supabaseConfigured: false }));

vi.mock("@/core/auth", () => ({
  useAuthSession: () => ({
    status: "unauthenticated",
    user: null,
    provider: "local-only",
  } satisfies AuthSession),
}));
vi.mock("@/core/sync", () => ({
  getSupabaseSyncConfiguration: () => mocks.supabaseConfigured
    ? {
        url: "https://example.invalid",
        anonKey: "public-test-key",
        authStorageKey: "test.auth",
      }
    : null,
}));

describe("Telegram reminder settings", () => {
  beforeEach(() => {
    mocks.supabaseConfigured = false;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it("validates enabled settings and keeps timezone options usable", () => {
    expect(
      validateTelegramReminderPreference({
        enabled: true,
        channel: "telegram",
        telegramChatId: "",
        timezone: "UTC",
        morningTime: "08:00",
      })
    ).toBe("settings.telegramReminderChatIdRequired");

    expect(
      validateTelegramReminderPreference({
        enabled: true,
        channel: "telegram",
        telegramChatId: "123456789",
        timezone: "UTC",
        morningTime: "08:00",
      })
    ).toBeNull();

    expect(getTelegramReminderTimeZoneOptions("UTC")).toContain("UTC");
  });

  it.each([
    { configured: false, message: "Supabase required", otherMessage: "Sign in required" },
    { configured: true, message: "Sign in required", otherMessage: "Supabase required" },
  ])("shows $message and disables controls for an unauthenticated user", ({ configured, message, otherMessage }) => {
    mocks.supabaseConfigured = configured;
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <TelegramReminderSettings />
      </I18nProvider>
    );

    expect(markup).toContain("Telegram reminders");
    expect(markup).toContain(message);
    expect(markup).not.toContain(otherMessage);
    const controls = markup.match(/<(?:input|select|button)\b[^>]*>/g) ?? [];
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control).toContain('disabled=""');
    }
    expect(markup).toContain("Bot tokens never live in the browser");
  });
});
