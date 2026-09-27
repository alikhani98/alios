import {
  emptyDeliveryResult,
  type DeliveryResult,
  type WebPushNotificationPayload,
} from "./deliveryTypes.ts";

export type StoredPushSubscription = Readonly<{
  id?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  consecutive_failures?: number;
}>;

export type WebPushAttemptResult = Readonly<{
  ok: boolean;
  status?: number;
  error?: string;
}>;

export type WebPushSenderCoreDependencies = Readonly<{
  supabaseUrl: string;
  supabaseServiceKey: string;
  fetch: typeof fetch;
  send: (
    subscription: StoredPushSubscription,
    payload: WebPushNotificationPayload
  ) => Promise<WebPushAttemptResult>;
}>;

function serviceRoleHeaders(
  deps: WebPushSenderCoreDependencies
): HeadersInit {
  return {
    apikey: deps.supabaseServiceKey,
    Authorization: `Bearer ${deps.supabaseServiceKey}`,
  };
}

async function loadSubscriptions(
  userId: string,
  deps: WebPushSenderCoreDependencies
): Promise<StoredPushSubscription[]> {
  const query = new URLSearchParams({
    select: "id,endpoint,p256dh,auth,user_agent,consecutive_failures",
    user_id: `eq.${userId}`,
  });
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/push_subscriptions?${query.toString()}`,
    {
      method: "GET",
      headers: serviceRoleHeaders(deps),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Web Push subscriptions: ${response.statusText}`
    );
  }

  const rows = (await response.json()) as StoredPushSubscription[] | null;
  return Array.isArray(rows) ? rows : [];
}

async function updateSubscriptionLifecycle(
  userId: string,
  subscription: StoredPushSubscription,
  update: Readonly<Record<string, unknown>>,
  deps: WebPushSenderCoreDependencies
): Promise<void> {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    endpoint: `eq.${subscription.endpoint}`,
  });
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/push_subscriptions?${query.toString()}`,
    {
      method: "PATCH",
      headers: {
        ...serviceRoleHeaders(deps),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(update),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to update Web Push subscription lifecycle: ${response.statusText}`
    );
  }
}

async function removeSubscription(
  userId: string,
  endpoint: string,
  deps: WebPushSenderCoreDependencies
): Promise<void> {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    endpoint: `eq.${endpoint}`,
  });
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/push_subscriptions?${query.toString()}`,
    {
      method: "DELETE",
      headers: {
        ...serviceRoleHeaders(deps),
        Prefer: "return=minimal",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to remove expired Web Push subscription: ${response.statusText}`
    );
  }
}

export async function sendWebPushNotifications(
  userId: string,
  payload: WebPushNotificationPayload,
  deps: WebPushSenderCoreDependencies
): Promise<DeliveryResult> {
  let subscriptions: StoredPushSubscription[];

  try {
    subscriptions = await loadSubscriptions(userId, deps);
  } catch (error) {
    return {
      successCount: 0,
      failureCount: 1,
      removedCount: 0,
      errors: [
        error instanceof Error
          ? error.message
          : "Failed to load Web Push subscriptions.",
      ],
    };
  }

  if (subscriptions.length === 0) {
    return emptyDeliveryResult();
  }

  let successCount = 0;
  let failureCount = 0;
  let removedCount = 0;
  const errors: string[] = [];

  for (const subscription of subscriptions) {
    let attempt: WebPushAttemptResult;

    try {
      attempt = await deps.send(subscription, payload);
    } catch (error) {
      attempt = {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Web Push delivery failed.",
      };
    }

    if (attempt.ok) {
      successCount++;
      try {
        await updateSubscriptionLifecycle(
          userId,
          subscription,
          {
            last_used_at: new Date().toISOString(),
            last_failure_at: null,
            consecutive_failures: 0,
            last_error: null,
          },
          deps
        );
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : "Failed to update Web Push subscription usage."
        );
      }
      continue;
    }

    if (attempt.status === 404 || attempt.status === 410) {
      try {
        await removeSubscription(userId, subscription.endpoint, deps);
        removedCount++;
      } catch (error) {
        failureCount++;
        errors.push(
          error instanceof Error
            ? error.message
            : "Failed to remove expired Web Push subscription."
        );
      }
      continue;
    }

    failureCount++;
    try {
      await updateSubscriptionLifecycle(
        userId,
        subscription,
        {
          last_failure_at: new Date().toISOString(),
          consecutive_failures:
            (subscription.consecutive_failures ?? 0) + 1,
          last_error:
            attempt.error ??
            `Web Push delivery failed with status ${
              attempt.status ?? "unknown"
            }.`,
        },
        deps
      );
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : "Failed to update Web Push subscription failure state."
      );
    }
    errors.push(
      attempt.error ??
        `Web Push delivery failed with status ${attempt.status ?? "unknown"}.`
    );
  }

  return {
    successCount,
    failureCount,
    removedCount,
    errors,
  };
}
