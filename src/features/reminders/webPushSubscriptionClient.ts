import { SUPABASE_AUTH_STORAGE_KEY } from "@/core/auth/supabaseAuthConfig";
import { getSupabaseSyncConfiguration } from "@/core/sync";

import type { WebPushSubscriptionData } from "./webPushTypes";
import type { WebPushSubscriptionResult } from "./webPushSubscription";

type WebPushSubscriptionResponse = Readonly<{
  ok: boolean;
  message?: string;
  subscription?: Readonly<{
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent: string | null;
  }>;
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

async function invokePushSubscription(
  body: unknown
): Promise<WebPushSubscriptionResponse> {
  const configuration = getSupabaseSyncConfiguration();
  if (!configuration) {
    throw new Error("Supabase is not configured for AliOS Web Push.");
  }

  const accessToken = readAccessToken();
  if (!accessToken) {
    throw new Error("Sign in before registering a Web Push subscription.");
  }

  const response = await fetch(
    `${configuration.url}/functions/v1/push-subscription`,
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
    | WebPushSubscriptionResponse
    | null;

  if (!response.ok || payload?.ok !== true) {
    throw new Error(
      payload?.message ?? "AliOS could not complete the Web Push request."
    );
  }

  return payload;
}

export async function registerWebPushSubscription(
  result: WebPushSubscriptionResult
): Promise<WebPushSubscriptionResponse> {
  if (result.status !== "subscribed") {
    throw new Error(
      "A granted Web Push subscription is required before registration."
    );
  }

  return invokePushSubscription({
    action: "register",
    subscription: result.subscription,
  });
}

export async function deleteWebPushSubscription(
  subscription: Pick<WebPushSubscriptionData, "endpoint">
): Promise<WebPushSubscriptionResponse> {
  return invokePushSubscription({
    action: "delete",
    endpoint: subscription.endpoint,
  });
}
