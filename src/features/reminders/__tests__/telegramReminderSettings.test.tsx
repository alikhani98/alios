import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AuthRuntimeProvider, localOnlyAuthProvider } from "@/core/auth";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { TelegramReminderSettings } from "../components/TelegramReminderSettings";
import {
  getTelegramReminderTimeZoneOptions,
  validateTelegramReminderPreference,
} from "../telegramReminderSettings";

describe("Telegram reminder settings", () => {
  beforeEach(() => {
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

  it("shows a visible sign-in boundary and disabled actions in local-only mode", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <AuthRuntimeProvider provider={localOnlyAuthProvider}>
          <TelegramReminderSettings />
        </AuthRuntimeProvider>
      </I18nProvider>
    );

    expect(markup).toContain("Telegram reminders");
    expect(markup).toContain("Sign in required");
    expect(markup).toContain('disabled=""');
    expect(markup).toContain("Bot tokens never live in the browser");
  });
});
