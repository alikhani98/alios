export type ReminderDeliveryChannel = "telegram" | "web_push";

export type DeliveryClaim = Readonly<{
  claimed: boolean;
  attempt_id: string;
  attempt_count: number;
  lease_token: string | null;
  status: string;
  retryable: boolean;
  next_attempt_at: string | null;
  last_error: string | null;
}>;

export type DeliveryStateDependencies = Readonly<{
  supabaseUrl: string;
  supabaseServiceKey: string;
  fetch: typeof fetch;
}>;

export type DeliveryFailure = Readonly<{
  retryable: boolean;
  error: string;
}>;

export const DELIVERY_LEASE_MS = 10 * 60 * 1000;
export const DELIVERY_RETRY_DELAYS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
] as const;

function rpcHeaders(deps: DeliveryStateDependencies): HeadersInit {
  return {
    apikey: deps.supabaseServiceKey,
    Authorization: `Bearer ${deps.supabaseServiceKey}`,
    "Content-Type": "application/json",
  };
}

async function callRpc(
  name: string,
  body: Record<string, unknown>,
  deps: DeliveryStateDependencies
): Promise<unknown> {
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/rpc/${name}`,
    {
      method: "POST",
      headers: rpcHeaders(deps),
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Reminder delivery RPC ${name} failed: ${response.statusText}`);
  }

  return response.status === 204 ? null : response.json();
}

export async function claimReminderDelivery(
  userId: string,
  channel: ReminderDeliveryChannel,
  localDate: string,
  now: Date,
  deps: DeliveryStateDependencies
): Promise<DeliveryClaim> {
  const payload = await callRpc(
    "claim_reminder_delivery",
    {
      p_user_id: userId,
      p_channel: channel,
      p_local_date: localDate,
      p_now: now.toISOString(),
      p_lease_until: new Date(now.getTime() + DELIVERY_LEASE_MS).toISOString(),
    },
    deps
  );

  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== "object") {
    throw new Error("Reminder delivery claim returned no state.");
  }

  const claim = row as Partial<DeliveryClaim>;
  if (
    typeof claim.claimed !== "boolean" ||
    typeof claim.attempt_id !== "string" ||
    typeof claim.attempt_count !== "number" ||
    typeof claim.status !== "string" ||
    typeof claim.retryable !== "boolean"
  ) {
    throw new Error("Reminder delivery claim returned an invalid state.");
  }

  return {
    claimed: claim.claimed,
    attempt_id: claim.attempt_id,
    attempt_count: claim.attempt_count,
    lease_token: typeof claim.lease_token === "string" ? claim.lease_token : null,
    status: claim.status,
    retryable: claim.retryable,
    next_attempt_at:
      typeof claim.next_attempt_at === "string" ? claim.next_attempt_at : null,
    last_error: typeof claim.last_error === "string" ? claim.last_error : null,
  };
}

export async function completeReminderDelivery(
  claim: DeliveryClaim,
  now: Date,
  deps: DeliveryStateDependencies
): Promise<boolean> {
  if (!claim.lease_token) {
    return false;
  }

  const result = await callRpc(
    "complete_reminder_delivery",
    {
      p_attempt_id: claim.attempt_id,
      p_lease_token: claim.lease_token,
      p_now: now.toISOString(),
    },
    deps
  );

  return result === true;
}

export async function failReminderDelivery(
  claim: DeliveryClaim,
  failure: DeliveryFailure,
  now: Date,
  deps: DeliveryStateDependencies
): Promise<boolean> {
  if (!claim.lease_token) {
    return false;
  }

  const retryable =
    failure.retryable &&
    claim.attempt_count <= DELIVERY_RETRY_DELAYS_MS.length;
  const nextAttemptAt = retryable
    ? new Date(
        now.getTime() +
          DELIVERY_RETRY_DELAYS_MS[
            Math.min(
              claim.attempt_count - 1,
              DELIVERY_RETRY_DELAYS_MS.length - 1
            )
          ]
      ).toISOString()
    : null;

  const result = await callRpc(
    "fail_reminder_delivery",
    {
      p_attempt_id: claim.attempt_id,
      p_lease_token: claim.lease_token,
      p_retryable: retryable,
      p_last_error: failure.error,
      p_next_attempt_at: nextAttemptAt,
      p_now: now.toISOString(),
    },
    deps
  );

  return result === true;
}

export async function findRetryableDeliveryUsers(
  now: Date,
  deps: DeliveryStateDependencies
): Promise<ReadonlySet<string>> {
  const query = new URLSearchParams({
    select: "user_id,local_date",
    status: "eq.failed",
    retryable: "eq.true",
    next_attempt_at: `lte.${now.toISOString()}`,
  });
  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/reminder_delivery_attempts?${query.toString()}`,
    {
      method: "GET",
      headers: {
        apikey: deps.supabaseServiceKey,
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch retryable reminder deliveries: ${response.statusText}`
    );
  }

  const rows = (await response.json()) as Array<{
    user_id?: unknown;
    local_date?: unknown;
  }> | null;

  return new Set(
    (Array.isArray(rows) ? rows : [])
      .filter(
        (row) =>
          typeof row.user_id === "string" &&
          typeof row.local_date === "string"
      )
      .map((row) => `${row.user_id}:${row.local_date}`)
  );
}
