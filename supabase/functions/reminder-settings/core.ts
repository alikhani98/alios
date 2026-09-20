import { createCorsHeaders } from "../_shared/cors.ts";

export type ReminderPreferenceRow = Readonly<{
  user_id: string;
  enabled: boolean;
  channel: "telegram";
  telegram_chat_id: string | null;
  timezone: string;
  morning_time: string;
  last_sent_local_date: string | null;
  updated_at?: string;
}>;

export type ReminderPreferenceInput = Readonly<{
  enabled: boolean;
  channel: "telegram";
  telegramChatId?: string | null;
  timezone: string;
  morningTime: string;
}>;

export type ReminderSettingsAction =
  | Readonly<{ action: "get" }>
  | Readonly<{ action: "save"; preference: ReminderPreferenceInput }>
  | Readonly<{ action: "test"; telegramChatId: string }>;

export type ReminderSettingsResult = Readonly<{
  ok: boolean;
  message: string;
  preference?: ReminderPreferenceRow | null;
  code?: string;
}>;

export type ReminderSettingsDependencies = Readonly<{
  supabaseUrl: string;
  supabaseAnonKey: string;
  telegramBotToken?: string;
  fetch: typeof fetch;
}>;

const telegramChatIdPattern = /^-?[0-9]+$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function jsonResponse(
  status: number,
  result: ReminderSettingsResult,
  origin: string | null
): Response {
  const headers = createCorsHeaders(origin);
  headers.set("content-type", "application/json");

  return new Response(JSON.stringify(result), {
    status,
    headers,
  });
}

function normalizeBearerToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function validateTelegramChatId(value: string): string {
  const normalized = value.trim();
  if (!telegramChatIdPattern.test(normalized)) {
    throw new Error("Telegram chat ID must contain only digits, with an optional leading minus sign.");
  }

  return normalized;
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeMorningTime(value: string): string {
  const normalized = value.trim();
  if (!timePattern.test(normalized)) {
    throw new Error("Morning time must use HH:mm format.");
  }

  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

export function validatePreferenceInput(
  input: ReminderPreferenceInput
): ReminderPreferenceInput {
  if (input.channel !== "telegram") {
    throw new Error("Telegram is the only supported reminder channel.");
  }

  const timezone = input.timezone.trim();
  if (!isValidTimeZone(timezone)) {
    throw new Error("Timezone is not valid.");
  }

  const telegramChatId = input.telegramChatId?.trim() || null;
  if (input.enabled && !telegramChatId) {
    throw new Error("Telegram chat ID is required when reminders are enabled.");
  }

  return {
    enabled: input.enabled,
    channel: "telegram",
    telegramChatId: telegramChatId
      ? validateTelegramChatId(telegramChatId)
      : null,
    timezone,
    morningTime: normalizeMorningTime(input.morningTime),
  };
}

async function getUserId(
  deps: ReminderSettingsDependencies,
  accessToken: string
): Promise<string> {
  const response = await deps.fetch(`${deps.supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: deps.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("AliOS could not verify the authenticated Supabase session.");
  }

  const payload = (await response.json()) as { id?: unknown } | null;
  if (!payload || typeof payload.id !== "string" || payload.id.length === 0) {
    throw new Error("Supabase session did not include a user ID.");
  }

  return payload.id;
}

async function getPreference(
  deps: ReminderSettingsDependencies,
  accessToken: string,
  userId: string
): Promise<ReminderPreferenceRow | null> {
  const query = new URLSearchParams({
    select:
      "user_id,enabled,channel,telegram_chat_id,timezone,morning_time,last_sent_local_date,updated_at",
    user_id: `eq.${userId}`,
    limit: "1",
  });
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/reminder_preferences?${query.toString()}`,
    {
      method: "GET",
      headers: {
        apikey: deps.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("AliOS could not load Telegram reminder settings.");
  }

  const rows = (await response.json()) as ReminderPreferenceRow[] | null;
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function upsertPreference(
  deps: ReminderSettingsDependencies,
  accessToken: string,
  userId: string,
  input: ReminderPreferenceInput
): Promise<ReminderPreferenceRow> {
  const preference = validatePreferenceInput(input);
  const row = {
    user_id: userId,
    enabled: preference.enabled,
    channel: "telegram",
    telegram_chat_id: preference.telegramChatId,
    timezone: preference.timezone,
    morning_time: preference.morningTime,
  };

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/reminder_preferences?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        apikey: deps.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    }
  );

  if (!response.ok) {
    throw new Error("AliOS could not save Telegram reminder settings.");
  }

  const rows = (await response.json()) as ReminderPreferenceRow[] | null;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Supabase did not return the saved reminder settings.");
  }

  return rows[0];
}

async function readTelegramJson(response: Response): Promise<{
  ok?: unknown;
  description?: unknown;
}> {
  try {
    return (await response.json()) as {
      ok?: unknown;
      description?: unknown;
    };
  } catch {
    return {};
  }
}

async function sendTelegramTestMessage(
  deps: ReminderSettingsDependencies,
  telegramChatId: string
): Promise<void> {
  const token = deps.telegramBotToken?.trim();
  if (!token) {
    throw new Error("Telegram bot token is not configured for AliOS reminders.");
  }

  const chatId = validateTelegramChatId(telegramChatId);
  const baseUrl = `https://api.telegram.org/bot${token}`;
  const getChatResponse = await deps.fetch(`${baseUrl}/getChat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId }),
  });
  const getChatPayload = await readTelegramJson(getChatResponse);

  if (!getChatResponse.ok || getChatPayload.ok !== true) {
    throw new Error(
      typeof getChatPayload.description === "string"
        ? `Telegram could not find this chat ID: ${getChatPayload.description}`
        : "Telegram could not find this chat ID."
    );
  }

  const sendResponse = await deps.fetch(`${baseUrl}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text:
        "AliOS test reminder: Telegram delivery is connected. Scheduled reminders are not enabled in this stage yet.",
      disable_web_page_preview: true,
    }),
  });
  const sendPayload = await readTelegramJson(sendResponse);

  if (!sendResponse.ok || sendPayload.ok !== true) {
    throw new Error(
      typeof sendPayload.description === "string"
        ? `Telegram test message failed: ${sendPayload.description}`
        : "Telegram test message failed."
    );
  }
}

export async function handleReminderSettingsRequest(
  request: Request,
  deps: ReminderSettingsDependencies
): Promise<Response> {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const headers = createCorsHeaders(origin);
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, {
      ok: false,
      code: "method_not_allowed",
      message: "Reminder settings only accepts POST requests.",
    }, origin);
  }

  const accessToken = normalizeBearerToken(request.headers.get("authorization"));
  if (!accessToken) {
    return jsonResponse(401, {
      ok: false,
      code: "unauthenticated",
      message: "Sign in before configuring Telegram reminders.",
    }, origin);
  }

  let action: ReminderSettingsAction;
  try {
    action = (await request.json()) as ReminderSettingsAction;
  } catch {
    return jsonResponse(400, {
      ok: false,
      code: "invalid_json",
      message: "Reminder settings request was not valid JSON.",
    }, origin);
  }

  try {
    const userId = await getUserId(deps, accessToken);

    if (action.action === "get") {
      const preference = await getPreference(deps, accessToken, userId);
      return jsonResponse(200, {
        ok: true,
        message: "Telegram reminder settings loaded.",
        preference,
      }, origin);
    }

    if (action.action === "save") {
      const preference = await upsertPreference(
        deps,
        accessToken,
        userId,
        action.preference
      );
      return jsonResponse(200, {
        ok: true,
        message: "Telegram reminder settings saved.",
        preference,
      }, origin);
    }

    if (action.action === "test") {
      await sendTelegramTestMessage(deps, action.telegramChatId);
      return jsonResponse(200, {
        ok: true,
        message: "Telegram test message sent successfully.",
      }, origin);
    }

    return jsonResponse(400, {
      ok: false,
      code: "unknown_action",
      message: "Reminder settings action is not supported.",
    }, origin);
  } catch (error) {
    return jsonResponse(400, {
      ok: false,
      code: "reminder_settings_failed",
      message:
        error instanceof Error
          ? error.message
          : "AliOS could not complete the reminder settings request.",
    }, origin);
  }
}
