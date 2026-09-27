import { describe, expect, it, vi } from "vitest";

import {
  sendWebPushNotifications,
  type StoredPushSubscription,
} from "./webPushSenderCore";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createDependencies(
  fetch: typeof globalThis.fetch,
  send: (
    subscription: StoredPushSubscription,
    payload: {
      version: number;
      title: string;
      body: string;
      url: string;
    }
  ) => Promise<{ ok: boolean; status?: number; error?: string }>
) {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabaseServiceKey: "service-role",
    fetch,
    send,
  };
}

const payload = {
  version: 1,
  title: "Your Morning Reminders",
  body: "1 task due or overdue",
  url: "/#/today",
};

const firstSubscription = {
  endpoint: "https://push.example.test/first",
  p256dh: "first-p256dh",
  auth: "first-auth",
  user_agent: "First Browser",
};

describe("Web Push sender", () => {
  it("sends a notification to a stored subscription", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([firstSubscription]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sendMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });

    const result = await sendWebPushNotifications(
      "user-1",
      payload,
      createDependencies(fetchMock, sendMock)
    );

    expect(result).toEqual({
      successCount: 1,
      failureCount: 0,
      removedCount: 0,
      errors: [],
    });
    expect(sendMock).toHaveBeenCalledWith(firstSubscription, payload);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/rest/v1/push_subscriptions"
    );
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("user_id")).toBe(
      "eq.user-1"
    );
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      consecutive_failures: 0,
      last_failure_at: null,
      last_error: null,
    });
  });

  it("processes multiple subscriptions independently", async () => {
    const secondSubscription = {
      endpoint: "https://push.example.test/second",
      p256dh: "second-p256dh",
      auth: "second-auth",
      user_agent: "Second Browser",
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([firstSubscription, secondSubscription])
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sendMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 201 })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        error: "Push service unavailable",
      });

    const result = await sendWebPushNotifications(
      "user-1",
      payload,
      createDependencies(fetchMock, sendMock)
    );

    expect(result).toEqual({
      successCount: 1,
      failureCount: 1,
      removedCount: 0,
      errors: ["Push service unavailable"],
    });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([404, 410])(
    "removes subscriptions that return a permanent %s response",
    async (status) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([firstSubscription]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sendMock = vi.fn().mockResolvedValue({
      ok: false,
      status,
    });

    const result = await sendWebPushNotifications(
      "user-1",
      payload,
      createDependencies(fetchMock, sendMock)
    );

    expect(result).toEqual({
      successCount: 0,
      failureCount: 0,
      removedCount: 1,
      errors: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[1] ?? [];
    const query = new URL(String(url)).searchParams;
    expect(query.get("user_id")).toBe("eq.user-1");
    expect(query.get("endpoint")).toBe(`eq.${firstSubscription.endpoint}`);
    expect(options?.method).toBe("DELETE");
    }
  );

  it("records temporary failures without deleting the subscription", async () => {
    const subscription = {
      ...firstSubscription,
      consecutive_failures: 2,
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([subscription]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sendMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      error: "Push service unavailable",
    });

    const result = await sendWebPushNotifications(
      "user-1",
      payload,
      createDependencies(fetchMock, sendMock)
    );

    expect(result.failureCount).toBe(1);
    expect(result.removedCount).toBe(0);
    const [url, options] = fetchMock.mock.calls[1] ?? [];
    expect(options?.method).toBe("PATCH");
    expect(new URL(String(url)).searchParams.get("endpoint")).toBe(
      `eq.${subscription.endpoint}`
    );
    expect(JSON.parse(String(options?.body))).toMatchObject({
      consecutive_failures: 3,
      last_error: "Push service unavailable",
    });
  });
});
