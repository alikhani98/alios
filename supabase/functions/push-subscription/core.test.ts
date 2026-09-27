import { describe, expect, it, vi } from "vitest";

import { handlePushSubscriptionRequest } from "./core";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createRequest(body: unknown, token = "token") {
  return new Request("https://example.test/push-subscription", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function dependencies(fetch: typeof fetch) {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service-role",
    fetch,
  };
}

const subscription = {
  endpoint: "https://push.example.test/subscription",
  p256dh: "p256dh-value",
  auth: "auth-value",
  user_agent: "Test Browser",
};

describe("push-subscription Edge Function core", () => {
  it("requires an authenticated bearer token", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handlePushSubscriptionRequest(
      new Request("https://example.test/push-subscription", {
        method: "POST",
        body: JSON.stringify({ action: "register", subscription }),
      }),
      dependencies(fetchMock)
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "unauthenticated",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("inserts a subscription for the authenticated user", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "subscription-1",
            user_id: "user-1",
            ...subscription,
          },
        ])
      );

    const response = await handlePushSubscriptionRequest(
      createRequest({ action: "register", subscription }),
      dependencies(fetchMock)
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      subscription: {
        user_id: "user-1",
        endpoint: subscription.endpoint,
      },
    });

    const [, options] = fetchMock.mock.calls[1] ?? [];
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "on_conflict=user_id%2Cendpoint"
    );
    expect(options?.method).toBe("POST");
    expect(options?.headers).toMatchObject({
      apikey: "service-role",
      Authorization: "Bearer service-role",
      Prefer: "resolution=merge-duplicates,return=representation",
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      user_id: "user-1",
      ...subscription,
    });
  });

  it("updates an existing subscription through the same user-endpoint upsert", async () => {
    const updatedSubscription = {
      ...subscription,
      p256dh: "updated-p256dh",
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "subscription-1",
            user_id: "user-1",
            ...updatedSubscription,
          },
        ])
      );

    const response = await handlePushSubscriptionRequest(
      createRequest({
        action: "register",
        subscription: updatedSubscription,
      }),
      dependencies(fetchMock)
    );

    expect(response.status).toBe(200);
    const [, options] = fetchMock.mock.calls[1] ?? [];
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "on_conflict=user_id%2Cendpoint"
    );
    expect(JSON.parse(String(options?.body))).toMatchObject({
      user_id: "user-1",
      endpoint: subscription.endpoint,
      p256dh: "updated-p256dh",
    });
  });

  it("deletes only the authenticated user's subscription", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const response = await handlePushSubscriptionRequest(
      createRequest({
        action: "delete",
        endpoint: subscription.endpoint,
      }),
      dependencies(fetchMock)
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      message: "Web Push subscription removed.",
    });

    const [url, options] = fetchMock.mock.calls[1] ?? [];
    const query = new URL(String(url)).searchParams;
    expect(query.get("user_id")).toBe("eq.user-1");
    expect(query.get("endpoint")).toBe(`eq.${subscription.endpoint}`);
    expect(options?.method).toBe("DELETE");
    expect(options?.headers).toMatchObject({
      apikey: "service-role",
      Authorization: "Bearer service-role",
      Prefer: "return=minimal",
    });
  });

  it("rejects incomplete subscription payloads before database access", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const response = await handlePushSubscriptionRequest(
      createRequest({
        action: "register",
        subscription: {
          endpoint: subscription.endpoint,
          p256dh: "",
          auth: subscription.auth,
        },
      }),
      dependencies(fetchMock)
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "invalid_request",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
