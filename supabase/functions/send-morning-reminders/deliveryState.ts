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
export type DeliveryFailure = Readonly<{ retryable: boolean; error: string }>;
export const DELIVERY_LEASE_MS = 10 * 60 * 1000;
export const DELIVERY_RETRY_DELAYS_MS = [5 * 60_000, 15 * 60_000, 60 * 60_000, 360 * 60_000] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function serviceHeaders(deps: DeliveryStateDependencies): Record<string, string> {
  return { apikey: deps.supabaseServiceKey, Authorization: `Bearer ${deps.supabaseServiceKey}`, "Content-Type": "application/json" };
}
// Table-valued RPCs are subject to the same API row cap as tables.
export async function readPagedRows(resource: string, query: URLSearchParams, deps: DeliveryStateDependencies, body?: Record<string, unknown>): Promise<unknown[]> {
  const rows: unknown[] = [];
  let expectedTotal: number | undefined;
  for (let offset = 0; ;) {
    query.set("limit", "500");
    query.set("offset", String(offset));
    const response = await deps.fetch(`${deps.supabaseUrl}/rest/v1/${resource}?${query}`, {
      method: body ? "POST" : "GET",
      headers: { ...serviceHeaders(deps), Prefer: "count=exact" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error("reminder_source_unavailable");
    const page: unknown = await response.json();
    if (!Array.isArray(page)) throw new Error("reminder_source_invalid");
    const range = /^(?:(\d+)-(\d+)|\*)\/(\d+)$/.exec(response.headers.get("content-range") ?? "");
    if (!range) throw new Error("reminder_source_incomplete");
    const total = Number(range[3]);
    if (!Number.isSafeInteger(total) || total < 0 || (expectedTotal !== undefined && total !== expectedTotal) ||
        offset + page.length > total || page.length > 500 ||
        (page.length ? Number(range[1]) !== offset || Number(range[2]) !== offset + page.length - 1 : total !== offset)) {
      throw new Error("reminder_source_incomplete");
    }
    expectedTotal = total;
    rows.push(...page);
    offset += page.length;
    if (offset === total) return rows;
    if (!page.length) throw new Error("reminder_source_incomplete");
  }
}
export async function callRpc(name: string, body: Record<string, unknown>, deps: DeliveryStateDependencies): Promise<unknown> {
  try {
    const response = await deps.fetch(`${deps.supabaseUrl}/rest/v1/rpc/${name}`, {
      method: "POST", headers: serviceHeaders(deps), body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error();
    return response.status === 204 ? null : await response.json();
  } catch {
    // Never propagate response bodies, statusText, URLs, or transport errors.
    throw new Error("reminder_state_unavailable");
  }
}
export async function claimReminderDelivery(userId: string, channel: ReminderDeliveryChannel, localDate: string, now: Date, deps: DeliveryStateDependencies): Promise<DeliveryClaim> {
  const payload = await callRpc("claim_reminder_delivery", {
    p_user_id: userId, p_channel: channel, p_local_date: localDate,
    p_now: now.toISOString(), p_lease_until: new Date(now.getTime() + DELIVERY_LEASE_MS).toISOString(),
  }, deps);
  const row: unknown = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
  if (!isRecord(row) || typeof row.claimed !== "boolean" || typeof row.attempt_id !== "string" ||
      typeof row.attempt_count !== "number" || !Number.isInteger(row.attempt_count) ||
      row.attempt_count < 0 || (row.claimed && row.attempt_count > 5) || typeof row.status !== "string" ||
      typeof row.retryable !== "boolean" || (row.claimed && typeof row.lease_token !== "string")) {
    throw new Error("reminder_claim_invalid");
  }
  return {
    claimed: row.claimed, attempt_id: row.attempt_id, attempt_count: row.attempt_count,
    lease_token: typeof row.lease_token === "string" ? row.lease_token : null,
    status: row.status, retryable: row.retryable,
    next_attempt_at: typeof row.next_attempt_at === "string" ? row.next_attempt_at : null,
    last_error: typeof row.last_error === "string" ? row.last_error : null,
  };
}
export async function completeReminderDelivery(claim: DeliveryClaim, now: Date, deps: DeliveryStateDependencies): Promise<boolean> {
  if (!claim.lease_token) return false;
  return await callRpc("complete_reminder_delivery", {
    p_attempt_id: claim.attempt_id, p_lease_token: claim.lease_token, p_now: now.toISOString(),
  }, deps) === true;
}
export async function failReminderDelivery(claim: DeliveryClaim, failure: DeliveryFailure, now: Date, deps: DeliveryStateDependencies): Promise<boolean> {
  if (!claim.lease_token) return false;
  const retryable = failure.retryable && claim.attempt_count >= 1 && claim.attempt_count < 5;
  return await callRpc("fail_reminder_delivery", {
    p_attempt_id: claim.attempt_id, p_lease_token: claim.lease_token,
    p_retryable: retryable,
    p_last_error: /^(telegram|web_push)_(http_\d{3}|http_invalid|outcome_unknown|pre_dispatch_failure)$/.test(failure.error) ? failure.error : "provider_failure",
    p_next_attempt_at: retryable ? new Date(now.getTime() + DELIVERY_RETRY_DELAYS_MS[claim.attempt_count - 1]).toISOString() : null,
    p_now: now.toISOString(),
  }, deps) === true;
}
export async function authorizeTelegramDelivery(claim: DeliveryClaim, chatId: string, deps: DeliveryStateDependencies): Promise<boolean> {
  return await callRpc("begin_telegram_reminder_delivery", {
    p_attempt_id: claim.attempt_id, p_lease_token: claim.lease_token, p_chat_id: chatId,
  }, deps) === true;
}
