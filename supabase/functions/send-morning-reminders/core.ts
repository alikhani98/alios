import { emptyDeliveryResult, isPreDispatchNetworkFailure, isRetryableStatus, providerErrorCode, type DeliveryResult, type ProviderOutcome, type WebPushNotificationPayload } from "./deliveryTypes.ts";
import { authorizeTelegramDelivery, callRpc, claimReminderDelivery, completeReminderDelivery, failReminderDelivery, isRecord, readPagedRows, serviceHeaders, type DeliveryClaim, type DeliveryStateDependencies, type ReminderDeliveryChannel } from "./deliveryState.ts";

export type ReminderUser = Readonly<{
  user_id: string;
  channel: ReminderDeliveryChannel;
  telegram_chat_id: string | null;
  timezone: string;
  morning_time: string;
}>;
export type ReminderItem = Readonly<{ id: string; title: string; date?: string }>;
export type ReminderBatch = Readonly<{ task_due: ReminderItem[]; finance_obligation: ReminderItem[] }>;
export type MorningRemindersDependencies = DeliveryStateDependencies & Readonly<{
  telegramBotToken: string;
  now?: Date;
  sendWebPush?: (userId: string, payload: WebPushNotificationPayload, claim: DeliveryClaim) => Promise<DeliveryResult>;
}>;
export type MorningRemindersResult = Readonly<{
  ok: boolean; message: string; processed: number; sent: number; failed: number;
  telegram: DeliveryResult; web_push: DeliveryResult;
}>;

export function localSchedule(now: Date, timezone: string): { date: string; seconds: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, seconds: Number(part("hour")) * 3600 + Number(part("minute")) * 60 + Number(part("second")) };
}
export function eligiblePreference(value: unknown, now: Date): value is ReminderUser & { enabled: true } {
  if (!isRecord(value) || value.enabled !== true || typeof value.user_id !== "string" || !value.user_id ||
      (value.channel !== "telegram" && value.channel !== "web_push") || typeof value.timezone !== "string" ||
      typeof value.morning_time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value.morning_time)) return false;
  if (value.channel === "telegram" && (typeof value.telegram_chat_id !== "string" || !/^-?\d+$/.test(value.telegram_chat_id))) return false;
  try {
    const [hour, minute, second = 0] = value.morning_time.split(":").map(Number);
    return localSchedule(now, value.timezone).seconds >= hour * 3600 + minute * 60 + second;
  } catch { return false; }
}

function dateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function offsetDate(value: string, offset: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
async function sourcePayloads(userId: string, entity: string, deps: DeliveryStateDependencies): Promise<Record<string, unknown>[]> {
  const rows = await readPagedRows("alios_sync_records", new URLSearchParams({
    user_id: `eq.${userId}`, entity: `eq.${entity}`, select: "record_id,payload", order: "record_id.asc",
  }), deps);
  const identities = new Set<string>();
  return rows.flatMap((row) => {
    if (!isRecord(row) || typeof row.record_id !== "string" || !row.record_id || !isRecord(row.payload) || identities.has(row.record_id)) throw new Error("reminder_source_invalid");
    identities.add(row.record_id);
    // Sync deletion payloads retain previousRecord, but are never live reminders.
    if (row.payload.__aliosTombstone === true) return [];
    if (row.payload.id !== row.record_id) throw new Error("reminder_source_invalid");
    return [row.payload];
  });
}
export async function collectReminderItemsForUser(userId: string, localDate: string, deps: DeliveryStateDependencies): Promise<ReminderBatch> {
  const tasks = await sourcePayloads(userId, "tasks", deps);
  const obligations = await sourcePayloads(userId, "financeObligations", deps);
  const toItem = (row: Record<string, unknown>): ReminderItem => {
    if (typeof row.id !== "string" || typeof row.title !== "string") throw new Error("reminder_source_invalid");
    return { id: row.id, title: row.title, date: dateOnly(row.dueDate) ? row.dueDate : undefined };
  };
  const task_due = tasks.filter((task) =>
    ["todo", "doing", "deferred"].includes(String(task.status)) && dateOnly(task.dueDate) && task.dueDate <= localDate
  ).map(toItem);
  const dueDays = new Set(Array.from({ length: 4 }, (_, index) => Number(offsetDate(localDate, index).slice(-2))));
  const end = offsetDate(localDate, 3);
  const finance_obligation = obligations.filter((obligation) => {
    if (obligation.status !== "active") return false;
    if (typeof obligation.paidAmount !== "number" || !Number.isFinite(obligation.paidAmount) ||
        typeof obligation.totalAmount !== "number" || !Number.isFinite(obligation.totalAmount)) throw new Error("reminder_source_invalid");
    if (obligation.paidAmount >= obligation.totalAmount) return false;
    // Preserve the scheduler's existing inclusive three-day Finance window.
    return (dateOnly(obligation.dueDate) && obligation.dueDate >= localDate && obligation.dueDate <= end) ||
      (typeof obligation.dueDay === "number" && Number.isInteger(obligation.dueDay) && dueDays.has(obligation.dueDay));
  }).map((row) => ({ ...toItem(row), date: dateOnly(row.dueDate) ? row.dueDate : `روز ${row.dueDay} ماه` }));
  return { task_due, finance_obligation };
}
function pushPayload(batch: ReminderBatch): WebPushNotificationPayload {
  return {
    version: 1, title: "Your Morning Reminders",
    body: [batch.task_due.length ? `${batch.task_due.length} tasks due or overdue` : "",
      batch.finance_obligation.length ? `${batch.finance_obligation.length} finance obligations due` : ""].filter(Boolean).join(" · "),
    url: "/#/today",
  };
}
async function sendTelegram(user: ReminderUser, batch: ReminderBatch, deps: MorningRemindersDependencies): Promise<ProviderOutcome> {
  const lines = ["Your Morning Reminders"];
  for (const [category, items] of Object.entries(batch)) {
    if (!items.length) continue;
    lines.push(category === "task_due" ? "Tasks Due/Overdue:" : "تعهدات مالی:");
    const sorted = [...items].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    lines.push(...sorted.slice(0, 5).map((item) => `• ${item.title}${item.date ? ` (${item.date})` : ""}`));
    if (items.length > 5) lines.push(`+ ${items.length - 5} more`);
  }
  try {
    const response = await deps.fetch(`https://api.telegram.org/bot${deps.telegramBotToken}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      // Plain text avoids Markdown parse failures from user-entered titles.
      body: JSON.stringify({ chat_id: user.telegram_chat_id, text: lines.join("\n").slice(0, 4000) }),
      signal: AbortSignal.timeout(30_000),
    });
    let body: unknown;
    try { body = await response.json(); } catch {
      return { ok: false, status: response.status, unknown: response.ok };
    }
    if (response.ok && (!isRecord(body) || typeof body.ok !== "boolean")) return { ok: false, unknown: true };
    if (response.ok && isRecord(body) && body.ok === true) return { ok: true, status: response.status };
    const code = isRecord(body) && typeof body.error_code === "number" ? body.error_code : response.status;
    return { ok: false, status: !response.ok ? response.status : code };
  } catch (error) {
    // A lost response may follow provider acceptance; do not blindly resend.
    const preDispatchFailure = isPreDispatchNetworkFailure(error);
    return { ok: false, preDispatchFailure, unknown: !preDispatchFailure };
  }
}
function merge(a: DeliveryResult, b: DeliveryResult): DeliveryResult {
  return { successCount: a.successCount + b.successCount, failureCount: a.failureCount + b.failureCount,
    removedCount: a.removedCount + b.removedCount, errors: [...a.errors, ...b.errors] };
}
async function logBatch(user: ReminderUser, batch: ReminderBatch, localDate: string, status: string, metadata: Record<string, unknown>, deps: DeliveryStateDependencies): Promise<void> {
  for (const [category, items] of Object.entries(batch)) {
    if (!items.length) continue;
    const response = await deps.fetch(`${deps.supabaseUrl}/rest/v1/reminder_delivery_log`, {
      method: "POST", headers: { ...serviceHeaders(deps), Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: user.user_id, channel: user.channel, local_date: localDate, category,
        item_count: items.length, status: status === "sent" ? "sent" : status === "skipped" ? "skipped" : "failed",
        error_message: status === "sent" ? null : "reminder_batch_incomplete", metadata,
      }),
    });
    if (!response.ok) throw new Error("reminder_log_unavailable");
  }
}
export async function processMorningReminders(deps: MorningRemindersDependencies): Promise<MorningRemindersResult> {
  const now = new Date((deps.now ?? new Date()).getTime());
  await callRpc("expire_reminder_delivery_leases", {}, deps);
  const preferences = await readPagedRows("reminder_preferences", new URLSearchParams({
    select: "user_id,enabled,channel,telegram_chat_id,timezone,morning_time", order: "user_id.asc",
  }), deps);
  let telegram = emptyDeliveryResult();
  let webPush = emptyDeliveryResult();
  let sent = 0;
  let failed = 0;
  let processed = 0;
  let operationalError = false;
  for (const preference of preferences) {
    if (!eligiblePreference(preference, now)) continue;
    const user = preference;
    processed++;
    let outcomeRecorded = false;
    try {
      if ((user.channel === "web_push" && !deps.sendWebPush) || (user.channel === "telegram" && !deps.telegramBotToken.trim())) throw new Error("provider_unconfigured");
      const localDate = localSchedule(now, user.timezone).date;
      const batch = await collectReminderItemsForUser(user.user_id, localDate, deps);
      if (!batch.task_due.length && !batch.finance_obligation.length) continue;
      // SQL is authoritative for channel, retry state, opt-in, snapshot and leases.
      // last_sent_local_date is legacy informational metadata only.
      const claim = await claimReminderDelivery(user.user_id, user.channel, localDate, now, deps);
      if (!claim.claimed) continue;
      if (user.channel === "telegram") {
        if (!user.telegram_chat_id || !await authorizeTelegramDelivery(claim, user.telegram_chat_id, deps)) continue;
        const outcome = await sendTelegram(user, batch, deps);
        const recorded = outcome.ok
          ? await completeReminderDelivery(claim, now, deps)
          : await failReminderDelivery(claim, {
            retryable: !outcome.unknown && (outcome.preDispatchFailure === true || isRetryableStatus(outcome.status)), error: providerErrorCode("telegram", outcome),
          }, now, deps);
        telegram = merge(telegram, { successCount: outcome.ok ? 1 : 0, failureCount: outcome.ok ? 0 : 1,
          removedCount: 0, errors: outcome.ok ? [] : [providerErrorCode("telegram", outcome)] });
        if (!recorded) throw new Error("reminder_state_unavailable");
        if (outcome.ok) sent++; else failed++;
        outcomeRecorded = true;
        await logBatch(user, batch, localDate, outcome.ok ? "sent" : "failed", { outcome: outcome.unknown ? "unknown" : outcome.ok ? "sent" : "failed" }, deps);
      } else if (deps.sendWebPush) {
        let result: DeliveryResult;
        try { result = await deps.sendWebPush(user.user_id, pushPayload(batch), claim); }
        catch { result = { ...emptyDeliveryResult(), failureCount: 1, errors: ["web_push_state_unavailable"] }; }
        // Even if the sender interrupted, atomically reconcile all durable targets.
        const state = await callRpc("finalize_reminder_push_delivery", {
          p_attempt_id: claim.attempt_id, p_lease_token: claim.lease_token,
        }, deps);
        if (!isRecord(state) || state.recorded !== true || typeof state.status !== "string" || !["sent", "failed", "skipped"].includes(state.status) ||
            !["sent", "partial", "unknown", "failed", "no_targets"].includes(String(state.outcome)) ||
            typeof state.success_count !== "number" || typeof state.failure_count !== "number" ||
            typeof state.unknown_count !== "number" || typeof state.pending_count !== "number") throw new Error("reminder_state_unavailable");
        if (![state.success_count, state.failure_count, state.unknown_count, state.pending_count].every((count) => Number.isInteger(count) && count >= 0) ||
            (state.status === "sent" && (state.success_count === 0 || state.failure_count + state.unknown_count + state.pending_count !== 0))) throw new Error("reminder_state_unavailable");
        // Report durable snapshot outcomes, including devices accepted before a sender interruption.
        webPush = merge(webPush, {
          successCount: state.success_count, failureCount: state.failure_count + state.unknown_count + state.pending_count,
          removedCount: result.removedCount, errors: state.status === "failed" ? ["web_push_batch_incomplete"] : [],
        });
        if (state.status === "sent") sent++;
        else if (state.status !== "skipped") failed++;
        outcomeRecorded = true;
        await logBatch(user, batch, localDate, state.status, {
          outcome: state.outcome, success_count: state.success_count, failure_count: state.failure_count,
          unknown_count: state.unknown_count, pending_count: state.pending_count, removed_count: result.removedCount,
        }, deps);
      }
    } catch {
      operationalError = true;
      if (!outcomeRecorded) failed++;
      // Isolate accounts and do not expose exceptions from service-role requests.
    }
  }
  return { ok: failed === 0 && !operationalError, message: failed || operationalError ? "Some reminder batches were not completed" : "Morning reminders processed",
    processed, sent, failed, telegram, web_push: webPush };
}
