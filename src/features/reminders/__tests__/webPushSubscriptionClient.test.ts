// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteWebPushSubscription,
  registerWebPushSubscription,
} from "../webPushSubscriptionClient";

const fetchMock = vi.fn<typeof fetch>();

describe("Web Push subscription client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    window.localStorage.clear();
    window.localStorage.setItem(
      "alios.sync.supabase.auth",
      JSON.stringify({ access_token: "user-token" })
    );
  });

  it("sends the Phase 1 serialized subscription payload", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          message: "Web Push subscription saved.",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const subscription = {
      endpoint: "https://push.example.test/subscription",
      p256dh: "p256dh-value",
      auth: "auth-value",
      user_agent: "Test Browser",
    };

    await registerWebPushSubscription({
      status: "subscribed",
      capabilities: {
        notification: true,
        serviceWorker: true,
        pushManager: true,
        supported: true,
      },
      subscription,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/functions/v1/push-subscription",
      expect.objectContaining({
        method: "POST",
        headers: {
          apikey: "anon-key",
          Authorization: "Bearer user-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          subscription,
        }),
      })
    );
  });

  it("sends the endpoint for subscription deletion", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await deleteWebPushSubscription({
      endpoint: "https://push.example.test/subscription",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/functions/v1/push-subscription",
      expect.objectContaining({
        body: JSON.stringify({
          action: "delete",
          endpoint: "https://push.example.test/subscription",
        }),
      })
    );
  });

  it("does not send a request for an unsubscribed Phase 1 result", async () => {
    await expect(
      registerWebPushSubscription({
        status: "permission-denied",
        permission: "denied",
        capabilities: {
          notification: true,
          serviceWorker: true,
          pushManager: true,
          supported: true,
        },
      })
    ).rejects.toThrow("granted Web Push subscription");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
