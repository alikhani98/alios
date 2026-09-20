import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  handleReminderSettingsRequest,
  validatePreferenceInput,
  validateTelegramChatId,
} from "./core";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createRequest(body: unknown, token = "token") {
  return new Request("https://example.test/reminder-settings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("reminder-settings Edge Function core", () => {
  it("answers allowed-origin CORS preflight requests", async () => {
    const response = await handleReminderSettingsRequest(
      new Request("https://example.test/reminder-settings", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:5173" },
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: vi.fn(),
      }
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173"
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "authorization"
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "POST, OPTIONS"
    );
  });

  it("adds CORS headers to successful and error responses", async () => {
    const successResponse = await handleReminderSettingsRequest(
      new Request("https://example.test/reminder-settings", {
        method: "POST",
        headers: {
          origin: "https://alikhani98.github.io",
          authorization: "Bearer token",
        },
        body: JSON.stringify({ action: "get" }),
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: vi.fn<typeof fetch>().mockResolvedValueOnce(
          jsonResponse({ id: "user-1" })
        ).mockResolvedValueOnce(jsonResponse([])),
      }
    );

    expect(successResponse.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://alikhani98.github.io"
    );

    const errorResponse = await handleReminderSettingsRequest(
      new Request("https://example.test/reminder-settings", {
        method: "POST",
        headers: { origin: "http://localhost:5173" },
        body: JSON.stringify({ action: "get" }),
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: vi.fn(),
      }
    );

    expect(errorResponse.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173"
    );
  });

  it("does not allow an unapproved browser origin", async () => {
    const response = await handleReminderSettingsRequest(
      new Request("https://example.test/reminder-settings", {
        method: "POST",
        headers: {
          origin: "https://malicious.example",
        },
        body: JSON.stringify({ action: "get" }),
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: vi.fn(),
      }
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("validates Telegram preference input", () => {
    expect(() =>
      validatePreferenceInput({
        enabled: true,
        channel: "telegram",
        telegramChatId: "",
        timezone: "UTC",
        morningTime: "08:00",
      })
    ).toThrow("Telegram chat ID is required");

    expect(() => validateTelegramChatId("abc")).toThrow("Telegram chat ID");

    expect(
      validatePreferenceInput({
        enabled: true,
        channel: "telegram",
        telegramChatId: "-1001234567890",
        timezone: "UTC",
        morningTime: "08:30",
      })
    ).toMatchObject({
      telegramChatId: "-1001234567890",
      morningTime: "08:30:00",
    });
  });

  it("requires an authenticated bearer token", async () => {
    const response = await handleReminderSettingsRequest(
      new Request("https://example.test/reminder-settings", {
        method: "POST",
        body: JSON.stringify({ action: "get" }),
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: vi.fn(),
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("loads preferences through the authenticated Supabase user boundary", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            user_id: "user-1",
            enabled: true,
            channel: "telegram",
            telegram_chat_id: "123",
            timezone: "UTC",
            morning_time: "08:00:00",
            last_sent_local_date: null,
          },
        ])
      );

    const response = await handleReminderSettingsRequest(
      createRequest({ action: "get" }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: fetchMock,
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      preference: { user_id: "user-1", telegram_chat_id: "123" },
    });
    expect(fetchMock.mock.calls[1]?.[0]?.toString()).toContain(
      "user_id=eq.user-1"
    );
  });

  it("upserts only the authenticated user's preference row", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            user_id: "user-1",
            enabled: true,
            channel: "telegram",
            telegram_chat_id: "123",
            timezone: "UTC",
            morning_time: "08:00:00",
            last_sent_local_date: null,
          },
        ])
      );

    const response = await handleReminderSettingsRequest(
      createRequest({
        action: "save",
        preference: {
          enabled: true,
          channel: "telegram",
          telegramChatId: "123",
          timezone: "UTC",
          morningTime: "08:00",
        },
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        fetch: fetchMock,
      }
    );

    expect(response.status).toBe(200);
    const [, upsertOptions] = fetchMock.mock.calls[1] ?? [];
    expect(JSON.parse(String(upsertOptions?.body))).toMatchObject({
      user_id: "user-1",
      telegram_chat_id: "123",
    });
  });

  it("checks Telegram chat availability before sending a test message", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, result: { id: 123 } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, result: { message_id: 1 } }));

    const response = await handleReminderSettingsRequest(
      createRequest({
        action: "test",
        telegramChatId: "123",
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        telegramBotToken: "bot-token",
        fetch: fetchMock,
      }
    );

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/getChat");
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("/sendMessage");
  });

  it("returns a clear Telegram failure message", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(
        jsonResponse({ ok: false, description: "chat not found" }, 400)
      );

    const response = await handleReminderSettingsRequest(
      createRequest({
        action: "test",
        telegramChatId: "999",
      }),
      {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        telegramBotToken: "bot-token",
        fetch: fetchMock,
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: expect.stringContaining("chat not found"),
    });
  });

  it("documents RLS so users can access only their own row", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/202609200001_create_reminder_preferences.sql"
      ),
      "utf8"
    );

    expect(sql).toContain(
      "alter table public.reminder_preferences enable row level security"
    );
    expect(sql).toContain("using (user_id = auth.uid())");
    expect(sql).toContain("with check (user_id = auth.uid())");
    expect(sql).toContain("for select");
    expect(sql).toContain("for insert");
    expect(sql).toContain("for update");
    expect(sql).toContain("for delete");
  });
});
