import { afterEach, describe, expect, it, vi } from "vitest";

import { processMorningReminders } from "./core";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function baseDependencies(fetch: typeof fetch) {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabaseServiceKey: "service-role",
    telegramBotToken: "telegram-token",
    fetch,
  };
}

function eligiblePreference() {
  return {
    user_id: "user-1",
    enabled: true,
    channel: "telegram",
    telegram_chat_id: "12345",
    timezone: "UTC",
    morning_time: "00:00:00",
    last_sent_local_date: null,
  };
}

function dueTask() {
  return {
    payload: {
      id: "task-1",
      title: "Review task",
      status: "pending",
      dueDate: "2020-01-01",
    },
  };
}

function claimedDelivery(channel: "telegram" | "web_push") {
  return {
    claimed: true,
    attempt_id: `${channel}-attempt`,
    attempt_count: 1,
    lease_token: `${channel}-lease`,
    status: "processing",
    retryable: true,
    next_attempt_at: null,
    last_error: null,
  };
}

function createFetchMock() {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(jsonResponse([eligiblePreference()]))
    .mockResolvedValueOnce(jsonResponse([]))
    .mockResolvedValueOnce(jsonResponse([dueTask()]))
    .mockResolvedValueOnce(jsonResponse([]))
    .mockResolvedValueOnce(jsonResponse([claimedDelivery("telegram")]))
    .mockResolvedValueOnce(jsonResponse({ ok: true }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(jsonResponse(true))
    .mockResolvedValueOnce(new Response(null, { status: 201 }))
    .mockResolvedValueOnce(jsonResponse([claimedDelivery("web_push")]))
    .mockResolvedValueOnce(jsonResponse(true))
    .mockResolvedValueOnce(new Response(null, { status: 201 }));
}

function createWeeklyReviewFetchMock(timezone = "Asia/Tehran") {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      jsonResponse([{ ...eligiblePreference(), timezone }])
    )
    .mockResolvedValueOnce(jsonResponse([]))
    .mockResolvedValueOnce(jsonResponse([]))
    .mockResolvedValueOnce(jsonResponse([]))
    .mockResolvedValueOnce(jsonResponse([claimedDelivery("telegram")]))
    .mockResolvedValueOnce(jsonResponse({ ok: true }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(jsonResponse(true))
    .mockResolvedValueOnce(new Response(null, { status: 201 }));
}

describe("send-morning-reminders delivery flow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the existing Telegram delivery flow when Web Push is not configured", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T08:00:00Z"));

    const fetchMock = createFetchMock();

    const result = await processMorningReminders(
      baseDependencies(fetchMock)
    );

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.telegram).toMatchObject({
      successCount: 1,
      failureCount: 0,
    });
    expect(result.web_push).toMatchObject({
      successCount: 0,
      failureCount: 0,
      removedCount: 0,
    });
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("api.telegram.org")
      )
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("push_subscriptions")
      )
    ).toBe(false);
  });

  it("aggregates Web Push separately and logs it without changing Telegram success", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T08:00:00Z"));

    const fetchMock = createFetchMock();
    const sendWebPush = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 1,
      removedCount: 1,
      errors: ["Push service unavailable"],
    });

    const result = await processMorningReminders({
      ...baseDependencies(fetchMock),
      sendWebPush,
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.telegram).toMatchObject({
      successCount: 1,
      failureCount: 0,
    });
    expect(result.web_push).toEqual({
      successCount: 2,
      failureCount: 1,
      removedCount: 1,
      errors: ["Push service unavailable"],
    });
    expect(sendWebPush).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        version: 1,
        title: "Your Morning Reminders",
        url: "/#/today",
      })
    );

    const webPushLogCall = fetchMock.mock.calls.find(([url, options]) =>
      String(url).includes("reminder_delivery_log") &&
      String(options?.body).includes('"channel":"web_push"')
    );
    expect(webPushLogCall).toBeDefined();
    expect(String(webPushLogCall?.[1]?.body)).toContain(
      '"success_count":2'
    );
    expect(String(webPushLogCall?.[1]?.body)).toContain(
      '"failure_count":1'
    );
    expect(String(webPushLogCall?.[1]?.body)).toContain(
      '"removed_count":1'
    );
  });

  it("includes a weekly review reminder on Friday in the user's timezone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T21:00:00Z"));

    const fetchMock = createWeeklyReviewFetchMock();

    const result = await processMorningReminders(baseDependencies(fetchMock));

    expect(result.sent).toBe(1);

    const weeklyReviewLogCall = fetchMock.mock.calls.find(([url, options]) =>
      String(url).includes("reminder_delivery_log") &&
      String(options?.body).includes('"category":"weekly_review"')
    );
    expect(weeklyReviewLogCall).toBeDefined();
  });

  it("does not include a weekly review reminder on non-Friday in the user's timezone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T21:00:00Z"));

    const fetchMock = createWeeklyReviewFetchMock();

    const result = await processMorningReminders(baseDependencies(fetchMock));

    expect(result.sent).toBe(0);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("api.telegram.org")
      )
    ).toBe(false);
  });

  it("renders the weekly review section in the Telegram message on Friday", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T21:00:00Z"));

    const fetchMock = createWeeklyReviewFetchMock();

    await processMorningReminders(baseDependencies(fetchMock));

    const telegramCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("api.telegram.org")
    );
    const telegramBody = JSON.parse(String(telegramCall?.[1]?.body));

    expect(telegramBody.text).toContain("📋 مرور هفتگی:");
    expect(telegramBody.text).toContain(
      "• وقت مرور هفته است! AliOS را باز کنید."
    );
  });
});
