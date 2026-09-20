import { SUPABASE_AUTH_STORAGE_KEY } from "@/core/auth/supabaseAuthConfig";
import { getSupabaseSyncConfiguration } from "@/core/sync";

import type {
  TelegramReminderPreference,
  TelegramReminderPreferenceInput,
} from "./telegramReminderSettings";
import {
  defaultTelegramReminderPreference,
  normalizeTelegramReminderPreference,
} from "./telegramReminderSettings";

type ReminderPreferenceRow = Readonly<{
  enabled?: boolean;
  channel?: string;
  telegram_chat_id?: string | null;
  timezone?: string;
  morning_time?: string;
  last_sent_local_date?: string | null;
}>;

type ReminderSettingsResponse = Readonly<{
  ok: boolean;
  message?: string;
  preference?: ReminderPreferenceRow | null;
}>;

function readAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { access_token?: unknown };
    return typeof parsed.access_token === "string" &&
      parsed.access_token.trim().length > 0
      ? parsed.access_token.trim()
      : null;
  } catch {
    return null;
  }
}

function toPreference(
  row: ReminderPreferenceRow | null | undefined
): TelegramReminderPreference {
  if (!row) {
    return defaultTelegramReminderPreference;
  }

  return {
    enabled: row.enabled === true,
    channel: "telegram",
    telegramChatId: row.telegram_chat_id ?? "",
    timezone: row.timezone ?? defaultTelegramReminderPreference.timezone,
    morningTime: (row.morning_time ?? "08:00").slice(0, 5),
    lastSentLocalDate: row.last_sent_local_date ?? null,
  };
}

async function invokeReminderSettings(
  body: unknown
): Promise<ReminderSettingsResponse> {
  const configuration = getSupabaseSyncConfiguration();
  if (!configuration) {
    throw new Error("Supabase is not configured for AliOS reminders.");
  }

  const accessToken = readAccessToken();
  if (!accessToken) {
    throw new Error("Sign in before configuring Telegram reminders.");
  }

  const response = await fetch(
    `${configuration.url}/functions/v1/reminder-settings`,
    {
      method: "POST",
      headers: {
        apikey: configuration.anonKey,
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const payload = (await response.json().catch(() => null)) as
    | ReminderSettingsResponse
    | null;

  if (!response.ok || payload?.ok !== true) {
    throw new Error(
      payload?.message ?? "AliOS could not complete the reminder request."
    );
  }

  return payload;
}

export async function loadTelegramReminderPreference(): Promise<TelegramReminderPreference> {
  const payload = await invokeReminderSettings({ action: "get" });
  return toPreference(payload.preference);
}

export async function saveTelegramReminderPreference(
  input: TelegramReminderPreferenceInput
): Promise<TelegramReminderPreference> {
  const preference = normalizeTelegramReminderPreference(input);
  const payload = await invokeReminderSettings({
    action: "save",
    preference: {
      enabled: preference.enabled,
      channel: preference.channel,
      telegramChatId: preference.telegramChatId || null,
      timezone: preference.timezone,
      morningTime: preference.morningTime,
    },
  });

  return toPreference(payload.preference);
}

export async function sendTelegramReminderTest(
  telegramChatId: string
): Promise<string> {
  const payload = await invokeReminderSettings({
    action: "test",
    telegramChatId: telegramChatId.trim(),
  });

  return payload.message ?? "Telegram test message sent successfully.";
}
