import { createCorsHeaders } from "../_shared/cors.ts";

export type PushSubscriptionInput = Readonly<{
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
}>;

export type PushSubscriptionAction =
  | Readonly<{
      action: "register";
      subscription: PushSubscriptionInput;
    }>
  | Readonly<{
      action: "delete";
      endpoint: string;
    }>;

export type PushSubscriptionRow = Readonly<{
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at?: string;
  last_used_at?: string | null;
}>;

export type PushSubscriptionResponse = Readonly<{
  ok: boolean;
  message: string;
  subscription?: PushSubscriptionRow;
}>;

export type PushSubscriptionDependencies = Readonly<{
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  fetch: typeof fetch;
}>;

type JsonRecord = Record<string, unknown>;

function jsonResponse(
  status: number,
  result: PushSubscriptionResponse & { code?: string },
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function requiredString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function validateEndpoint(value: unknown): string {
  const endpoint = requiredString(value, "Push subscription endpoint");

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") {
      throw new Error("Push subscription endpoint must use HTTPS.");
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Push subscription endpoint must use HTTPS."
    ) {
      throw error;
    }

    throw new Error("Push subscription endpoint must be a valid HTTPS URL.");
  }

  return endpoint;
}

function validateSubscription(value: unknown): PushSubscriptionInput {
  if (!isRecord(value)) {
    throw new Error("Push subscription is required.");
  }

  const userAgent = value.user_agent;
  if (
    userAgent !== undefined &&
    userAgent !== null &&
    typeof userAgent !== "string"
  ) {
    throw new Error("Push subscription user agent must be a string or null.");
  }

  return {
    endpoint: validateEndpoint(value.endpoint),
    p256dh: requiredString(value.p256dh, "Push subscription p256dh key"),
    auth: requiredString(value.auth, "Push subscription auth key"),
    user_agent:
      typeof userAgent === "string" && userAgent.trim().length > 0
        ? userAgent.trim()
        : null,
  };
}

function parseAction(value: unknown): PushSubscriptionAction {
  if (!isRecord(value) || typeof value.action !== "string") {
    throw new Error("Push subscription action is required.");
  }

  if (value.action === "register") {
    return {
      action: "register",
      subscription: validateSubscription(value.subscription),
    };
  }

  if (value.action === "delete") {
    return {
      action: "delete",
      endpoint: validateEndpoint(value.endpoint),
    };
  }

  throw new Error("Push subscription action is not supported.");
}

async function getUserId(
  deps: PushSubscriptionDependencies,
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

function serviceRoleHeaders(
  deps: PushSubscriptionDependencies,
  includeJson = false
): HeadersInit {
  return {
    apikey: deps.supabaseServiceRoleKey,
    Authorization: `Bearer ${deps.supabaseServiceRoleKey}`,
    ...(includeJson ? { "content-type": "application/json" } : {}),
  };
}

async function registerSubscription(
  deps: PushSubscriptionDependencies,
  userId: string,
  subscription: PushSubscriptionInput
): Promise<PushSubscriptionRow> {
  const query = new URLSearchParams({
    on_conflict: "user_id,endpoint",
  });
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/push_subscriptions?${query.toString()}`,
    {
      method: "POST",
      headers: {
        ...serviceRoleHeaders(deps, true),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        ...subscription,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("AliOS could not save the Web Push subscription.");
  }

  const rows = (await response.json()) as PushSubscriptionRow[] | null;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Supabase did not return the saved Web Push subscription.");
  }

  return rows[0];
}

async function deleteSubscription(
  deps: PushSubscriptionDependencies,
  userId: string,
  endpoint: string
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
    throw new Error("AliOS could not remove the Web Push subscription.");
  }
}

export async function handlePushSubscriptionRequest(
  request: Request,
  deps: PushSubscriptionDependencies
): Promise<Response> {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      405,
      {
        ok: false,
        code: "method_not_allowed",
        message: "Push subscription only accepts POST requests.",
      },
      origin
    );
  }

  const accessToken = normalizeBearerToken(
    request.headers.get("authorization")
  );
  if (!accessToken) {
    return jsonResponse(
      401,
      {
        ok: false,
        code: "unauthenticated",
        message: "Sign in before registering a Web Push subscription.",
      },
      origin
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch (error) {
    return jsonResponse(
      400,
      {
        ok: false,
        code: "invalid_json",
        message:
          error instanceof Error
            ? error.message
            : "Push subscription request was not valid JSON.",
      },
      origin
    );
  }

  let action: PushSubscriptionAction;
  try {
    action = parseAction(requestBody);
  } catch (error) {
    return jsonResponse(
      400,
      {
        ok: false,
        code: "invalid_request",
        message:
          error instanceof Error
            ? error.message
            : "Push subscription request was not valid.",
      },
      origin
    );
  }

  try {
    const userId = await getUserId(deps, accessToken);

    if (action.action === "register") {
      const subscription = await registerSubscription(
        deps,
        userId,
        action.subscription
      );

      return jsonResponse(
        200,
        {
          ok: true,
          message: "Web Push subscription saved.",
          subscription,
        },
        origin
      );
    }

    await deleteSubscription(deps, userId, action.endpoint);

    return jsonResponse(
      200,
      {
        ok: true,
        message: "Web Push subscription removed.",
      },
      origin
    );
  } catch (error) {
    return jsonResponse(
      400,
      {
        ok: false,
        code: "push_subscription_failed",
        message:
          error instanceof Error
            ? error.message
            : "AliOS could not complete the Web Push subscription request.",
      },
      origin
    );
  }
}
