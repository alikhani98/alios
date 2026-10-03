import { describe, expect, it, vi } from "vitest";

import { handleTelegramUpdate } from "./core";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createRequest(body: unknown, secret = "webhook-secret") {
  return new Request("https://example.test/telegram-bot", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Telegram-Bot-Api-Secret-Token": secret,
    },
    body: JSON.stringify(body),
  });
}

function deps(fetchMock: typeof fetch) {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabaseServiceKey: "service-role",
    botToken: "bot-token",
    webhookSecret: "webhook-secret",
    fetch: fetchMock,
  };
}

function messageUpdate(text: string, chatId = 12345) {
  return {
    message: {
      chat: { id: chatId },
      text,
    },
  };
}

function callbackUpdate(data: string, chatId = 12345) {
  return {
    callback_query: {
      id: "callback-1",
      data,
      message: {
        chat: { id: chatId },
      },
    },
  };
}

function createFetchMock(authorized = true) {
  return vi.fn<typeof fetch>().mockImplementation((url, options) => {
    const urlText = String(url);

    if (urlText.includes("reminder_preferences")) {
      return Promise.resolve(
        jsonResponse(authorized ? [{ user_id: "user-1" }] : [])
      );
    }

    if (urlText.includes("api.telegram.org")) {
      return Promise.resolve(jsonResponse({ ok: true, result: {} }));
    }

    return Promise.resolve(jsonResponse({ ok: true }));
  });
}

function telegramMessages(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/sendMessage")
  );
}

describe("telegram-bot Edge Function core", () => {
  it("silently drops requests with an invalid webhook secret", async () => {
    const fetchMock = createFetchMock();

    const response = await handleTelegramUpdate(
      createRequest(messageUpdate("/start"), "wrong-secret"),
      deps(fetchMock)
    );

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks an unknown chat_id before routing commands", async () => {
    const fetchMock = createFetchMock(false);

    const response = await handleTelegramUpdate(
      createRequest(messageUpdate("/start", 999)),
      deps(fetchMock)
    );

    expect(response.status).toBe(200);
    const messages = telegramMessages(fetchMock);
    expect(messages).toHaveLength(1);
    expect(String(messages[0]?.[1]?.body)).toContain("دسترسی مجاز نیست");
    expect(String(messages[0]?.[1]?.body)).not.toContain("inline_keyboard");
  });

  it("allows a known chat_id through authorization", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(fetchMock.mock.calls[0]?.[0]?.toString()).toContain(
      "reminder_preferences"
    );
    expect(fetchMock.mock.calls[0]?.[0]?.toString()).toContain(
      "telegram_chat_id=eq.12345"
    );
    expect(String(telegramMessages(fetchMock)[0]?.[1]?.body)).toContain(
      "در دست ساخت"
    );
  });

  it("routes /start to the Telegram menu", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/start")), deps(fetchMock));

    const body = String(telegramMessages(fetchMock)[0]?.[1]?.body);
    expect(body).toContain("AliOS");
    expect(body).toContain("inline_keyboard");
    expect(body).toContain("today");
    expect(body).toContain("inbox");
    expect(body).toContain("goals");
  });

  it("routes /menu to the Telegram menu", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/menu")), deps(fetchMock));

    const body = String(telegramMessages(fetchMock)[0]?.[1]?.body);
    expect(body).toContain("AliOS");
    expect(body).toContain("inline_keyboard");
  });

  it("replies to an unknown command", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/unknown")), deps(fetchMock));

    expect(String(telegramMessages(fetchMock)[0]?.[1]?.body)).toContain(
      "دستور شناخته نشد"
    );
  });

  it("replies to the today callback with the stub message", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(callbackUpdate("today")), deps(fetchMock));

    expect(String(telegramMessages(fetchMock)[0]?.[1]?.body)).toContain(
      "در دست ساخت"
    );
  });

  it("always answers callback_query updates after routing", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(callbackUpdate("today")), deps(fetchMock));

    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/answerCallbackQuery")
      )
    ).toBe(true);
  });
});
