// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SUPABASE_AUTH_STORAGE_KEY } from "@/core/auth/supabaseAuthConfig";
import { loadTelegramReminderPreference, saveTelegramReminderPreference } from "../telegramReminderSettingsClient";

vi.mock("@/core/sync", () => ({
  getSupabaseSyncConfiguration: () => ({ url: "https://example.invalid", anonKey: "public-test-key" }),
}));

describe("reminder settings persistence response", () => {
  const input = { enabled: true, channel: "web_push", telegramChatId: "12345", timezone: "UTC", morningTime: "08:00" } as const;
  const row = { enabled: true, channel: "web_push", telegram_chat_id: "12345", timezone: "UTC", morning_time: "08:00:00", last_sent_local_date: null };
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, JSON.stringify({ access_token: "test-session-token" }));
  });
  afterEach(() => {
    window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    vi.unstubAllGlobals();
  });
  function respond(payload: unknown, status = 200) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status }));
  }

  it("preserves the selected channel and unrelated fields in the existing save payload and reads the persisted result", async () => {
    respond({ ok: true, preference: row });
    expect(await saveTelegramReminderPreference(input)).toMatchObject(input);
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toEqual({
      action: "save", preference: {
        enabled: true, channel: "web_push", telegramChatId: "12345", timezone: "UTC", morningTime: "08:00",
      },
    });
    respond({ ok: true, preference: row });
    expect(await loadTelegramReminderPreference()).toMatchObject(input);
  });

  it.each([null, {}, { ...row, channel: "unknown" }, { ...row, channel: "both" }, { ...row, enabled: "true" }])(
    "rejects a save acknowledgement without a valid persisted preference: %j", async (preference) => {
      respond({ ok: true, preference });
      await expect(saveTelegramReminderPreference(input)).rejects.toBeDefined();
    });

  it("preserves the existing new-account default only for an empty read", async () => {
    respond({ ok: true, preference: null });
    expect(await loadTelegramReminderPreference()).toMatchObject({ enabled: false, channel: "telegram" });
  });

  it("reads legacy both without canonicalizing it to a selected channel or writing a replacement", async () => {
    respond({ ok: true, preference: { ...row, channel: "both" } });
    expect(await loadTelegramReminderPreference()).toMatchObject({ ...input, channel: "both" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ action: "get" });
  });

  it("rejects an incomplete read instead of treating it as an empty account", async () => {
    respond({ ok: true });
    await expect(loadTelegramReminderPreference()).rejects.toBeDefined();
  });

  it("rejects failed persistence instead of returning a successful default", async () => {
    respond({ ok: false, message: "Save failed" }, 503);
    await expect(saveTelegramReminderPreference(input)).rejects.toThrow("Save failed");
  });
  it("rejects a legacy both write before making any network request", async () => {
    await expect(saveTelegramReminderPreference({
      ...input,
      // @ts-expect-error Legacy values are readable, but cannot be a new channel selection.
      channel: "both",
    })).rejects.toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

});
