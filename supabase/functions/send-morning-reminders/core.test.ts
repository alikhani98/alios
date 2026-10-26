import { describe, expect, it, vi } from "vitest";
import { collectReminderItemsForUser, eligiblePreference, localSchedule, processMorningReminders, type MorningRemindersDependencies } from "./core";
import { emptyDeliveryResult } from "./deliveryTypes";
import { TASK_STATUS_VALUES } from "../../../src/shared/constants/domain";

const now = new Date("2026-10-24T08:00:00Z");
const preference = (overrides: Record<string, unknown> = {}) => ({
  user_id: "user-1", enabled: true, channel: "telegram", telegram_chat_id: "123",
  timezone: "UTC", morning_time: "08:00:00", last_sent_local_date: "2026-10-24", ...overrides,
});
const task = (overrides: Record<string, unknown> = {}) => ({
  payload: { id: "task-1", title: "Task [plain text]", status: "todo", dueDate: "2026-10-24", ...overrides },
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: Array.isArray(body) ? { "content-range": body.length ? `0-${body.length - 1}/${body.length}` : "*/0" } : {},
});

function fixture(preferences = [preference()]) {
  const logs: Record<string, unknown>[] = [];
  const claimed = new Set<string>();
  const failures: Record<string, unknown>[] = [];
  const calls: { name: string; body: Record<string, unknown> }[] = [];
  let sourceFailure = "";
  let telegramResponse = () => json({ ok: true });
  let finalState = { recorded: true, status: "sent", outcome: "sent", success_count: 1, failure_count: 0, unknown_count: 0, pending_count: 0 };
  let tasks: unknown[] = [task()];
  let finance: unknown[] = [];
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname === "api.telegram.org") return telegramResponse();
    if (url.pathname.includes("/rpc/")) {
      const name = url.pathname.split("/").at(-1)!;
      const body = JSON.parse(String(options?.body)) as Record<string, unknown>;
      calls.push({ name, body });
      if (name === "expire_reminder_delivery_leases") return json(0);
      if (name === "claim_reminder_delivery") {
        const key = `${body.p_user_id}:${body.p_channel}:${body.p_local_date}`;
        const allowed = !claimed.has(key);
        claimed.add(key);
        return json([{
          claimed: allowed, attempt_id: key, attempt_count: 1, lease_token: "lease",
          status: allowed ? "processing" : "sent", retryable: allowed, next_attempt_at: null, last_error: null,
        }]);
      }
      if (name === "begin_telegram_reminder_delivery") return json(true);
      if (name === "complete_reminder_delivery") return json(true);
      if (name === "fail_reminder_delivery") { failures.push(body); return json(true); }
      if (name === "finalize_reminder_push_delivery") return json(finalState);
      throw new Error(`Unexpected RPC: ${name}`);
    }
    if (url.pathname.endsWith("reminder_preferences")) return json(preferences);
    if (url.pathname.endsWith("alios_sync_records")) {
      expect(url.searchParams.get("user_id")).toMatch(/^eq.user-[12]$/);
      const entity = url.searchParams.get("entity");
      if (entity === sourceFailure) return json({ message: "secret https://private/token" }, 503);
      const rows = entity === "eq.tasks" ? tasks : finance;
      return json(rows.map((row) => {
        if (typeof row !== "object" || row === null || !("payload" in row)) return row;
        const payload = row.payload;
        return { record_id: typeof payload === "object" && payload !== null && "id" in payload ? payload.id : "deleted", ...row };
      }));
    }
    if (url.pathname.endsWith("reminder_delivery_log")) {
      logs.push(JSON.parse(String(options?.body)) as Record<string, unknown>);
      return new Response(null, { status: 201 });
    }
    throw new Error("Unexpected request");
  });
  const sendWebPush = vi.fn<NonNullable<MorningRemindersDependencies["sendWebPush"]>>(async () => ({ ...emptyDeliveryResult(), successCount: 1 }));
  const deps = { supabaseUrl: "https://db.example.test", supabaseServiceKey: "fake-service",
    telegramBotToken: "fake-bot", fetch: fetchMock, now, sendWebPush };
  return { deps, calls, logs, failures, fetchMock, sendWebPush,
    sourceFailure: (entity: string) => { sourceFailure = entity; },
    provider: (response: () => Response) => { telegramResponse = response; },
    sources: (nextTasks: unknown[], nextFinance: unknown[]) => { tasks = nextTasks; finance = nextFinance; },
    final: (state: typeof finalState) => { finalState = state; } };
}
describe("A3 scheduler channel and source safety", () => {
  it("sends only Telegram despite a configured push sender and legacy last-sent date", async () => {
    const f = fixture();
    const result = await processMorningReminders(f.deps);
    expect(result.sent).toBe(1);
    expect(f.sendWebPush).not.toHaveBeenCalled();
    expect(f.calls.filter((call) => call.name === "claim_reminder_delivery").map((call) => call.body.p_channel)).toEqual(["telegram"]);
    const send = f.fetchMock.mock.calls.find(([url]) => String(url).includes("api.telegram.org"));
    expect(JSON.parse(String(send?.[1]?.body))).toMatchObject({ chat_id: "123" });
    expect(String(send?.[1]?.body)).not.toContain("parse_mode");
  });
  it("sends only Web Push, without needing a Telegram Chat ID", async () => {
    const f = fixture([preference({ channel: "web_push", telegram_chat_id: null })]);
    expect((await processMorningReminders(f.deps)).sent).toBe(1);
    expect(f.sendWebPush).toHaveBeenCalledTimes(1);
    expect(f.fetchMock.mock.calls.some(([url]) => String(url).includes("api.telegram.org"))).toBe(false);
    expect(f.calls.find((call) => call.name === "claim_reminder_delivery")?.body.p_channel).toBe("web_push");
  });
  it.each([
    { enabled: false }, { enabled: "true" }, { channel: "both" }, { channel: "invalid" }, { channel: null },
    { telegram_chat_id: null }, { telegram_chat_id: "" }, { telegram_chat_id: "abc" },
    { timezone: "invalid/zone" }, { morning_time: "25:00:00" },
  ])("fails closed for disabled, missing-chat or invalid preferences: %j", async (override) => {
    const f = fixture([preference(override)]);
    const result = await processMorningReminders(f.deps);
    expect(result.processed).toBe(0);
    expect(f.calls.some((call) => call.name === "claim_reminder_delivery")).toBe(false);
    expect(f.sendWebPush).not.toHaveBeenCalled();
    expect(f.logs).toEqual([]);
  });
  it("does not consume a previous Telegram channel retry after a channel switch", async () => {
    const f = fixture([preference({ channel: "web_push" })]);
    await processMorningReminders(f.deps);
    expect(f.calls.filter((call) => call.name === "claim_reminder_delivery").every((call) => call.body.p_channel === "web_push")).toBe(true);
  });
  it("does not send Telegram when a preference change invalidates dispatch after claiming", async () => {
    const f = fixture();
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).endsWith("/begin_telegram_reminder_delivery")) return json(false);
      return underlying(url, options);
    });
    await processMorningReminders(f.deps);
    expect(f.fetchMock.mock.calls.some(([url]) => String(url).includes("api.telegram.org"))).toBe(false);
    expect(f.logs).toEqual([]);
  });
  it("does not count an empty subscription snapshot as successful delivery", async () => {
    const f = fixture([preference({ channel: "web_push" })]);
    f.final({ recorded: true, status: "skipped", outcome: "no_targets", success_count: 0, failure_count: 0, unknown_count: 0, pending_count: 0 });
    const result = await processMorningReminders(f.deps);
    expect(result.sent).toBe(0);
    expect(result.web_push.successCount).toBe(0);
    expect(f.logs[0]?.status).toBe("skipped");
  });
  it("does not mark a partial Web Push batch sent", async () => {
    const f = fixture([preference({ channel: "web_push" })]);
    f.final({ recorded: true, status: "failed", outcome: "partial", success_count: 1, failure_count: 0, unknown_count: 0, pending_count: 1 });
    f.sendWebPush.mockResolvedValue({ successCount: 1, failureCount: 1, removedCount: 0, errors: ["https://private/token"] });
    const result = await processMorningReminders(f.deps);
    expect(result.sent).toBe(0);
    expect(result.ok).toBe(false);
    expect(f.logs[0]).toMatchObject({ status: "failed", metadata: { outcome: "partial", pending_count: 1 } });
    expect(JSON.stringify(result)).not.toContain("private");
  });
  it.each(["eq.tasks", "eq.financeObligations"])("does not send or write success after failed %s reads", async (entity) => {
    const f = fixture();
    f.sourceFailure(entity);
    const result = await processMorningReminders(f.deps);
    expect(result.ok).toBe(false);
    expect(result.sent).toBe(0);
    expect(f.logs).toEqual([]);
    expect(f.calls.some((call) => call.name === "claim_reminder_delivery")).toBe(false);
  });
  it("follows server-capped source pages instead of silently omitting later rows", async () => {
    const f = fixture();
    const underlying = f.deps.fetch;
    const offsets: string[] = [];
    f.deps.fetch = vi.fn<typeof fetch>(async (input, options) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("alios_sync_records") && url.searchParams.get("entity") === "eq.tasks") {
        const offset = url.searchParams.get("offset") ?? "0";
        offsets.push(offset);
        return new Response(JSON.stringify([{ record_id: `task-${offset}`, ...task({ id: `task-${offset}` }) }]), {
          headers: { "content-range": `${offset}-${offset}/2` },
        });
      }
      return underlying(input, options);
    });
    const batch = await collectReminderItemsForUser("user-1", "2026-10-24", f.deps);
    expect(batch.task_due).toHaveLength(2);
    expect(offsets).toEqual(["0", "1"]);
  });
  it("rejects a source response without a trustworthy total instead of sending an incomplete digest", async () => {
    const f = fixture();
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).includes("alios_sync_records")) return new Response(JSON.stringify([task()]));
      return underlying(url, options);
    });
    expect((await processMorningReminders(f.deps)).ok).toBe(false);
    expect(f.logs).toEqual([]);
  });
  it("isolates user queries, claims, logs, and provider destinations", async () => {
    const f = fixture([preference(), preference({ user_id: "user-2", channel: "web_push", telegram_chat_id: null })]);
    const result = await processMorningReminders(f.deps);
    expect(result.sent).toBe(2);
    expect(f.calls.filter((call) => call.name === "claim_reminder_delivery").map((call) => [call.body.p_user_id, call.body.p_channel])).toEqual([
      ["user-1", "telegram"], ["user-2", "web_push"],
    ]);
    expect(f.logs.map((log) => [log.user_id, log.channel])).toEqual([["user-1", "telegram"], ["user-2", "web_push"]]);
    expect(f.sendWebPush.mock.calls[0]?.[0]).toBe("user-2");
  });
  it("respects a denied atomic claim across repeated and concurrent invocations", async () => {
    const f = fixture();
    await Promise.all([processMorningReminders(f.deps), processMorningReminders(f.deps)]);
    await processMorningReminders(f.deps);
    expect(f.fetchMock.mock.calls.filter(([url]) => String(url).includes("api.telegram.org"))).toHaveLength(1);
    expect(f.logs).toHaveLength(1);
  });
  it("never generates Weekly Review outbound content, including Friday", async () => {
    const f = fixture();
    f.sources([], []);
    const result = await processMorningReminders({ ...f.deps, now: new Date("2026-10-23T08:00:00Z") });
    expect(result.sent).toBe(0);
    expect(f.calls.some((call) => call.name === "claim_reminder_delivery")).toBe(false);
    expect(f.logs).toEqual([]);
  });
  it("keeps Friday Task delivery while excluding Weekly Review from payloads and logs", async () => {
    const f = fixture();
    f.sources([task({ dueDate: "2026-10-23" })], []);
    expect((await processMorningReminders({ ...f.deps, now: new Date("2026-10-23T08:00:00Z") })).sent).toBe(1);
    const send = f.fetchMock.mock.calls.find(([url]) => String(url).includes("api.telegram.org"));
    expect(String(send?.[1]?.body)).toContain("Tasks Due/Overdue");
    expect(String(send?.[1]?.body)).not.toMatch(/weekly|مرور هفتگی/i);
    expect(f.logs.map((log) => log.category)).toEqual(["task_due"]);
  });
  it("isolates one user's source failure from another user's delivery", async () => {
    const f = fixture([preference(), preference({ user_id: "user-2" })]);
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).includes("alios_sync_records") && new URL(String(url)).searchParams.get("user_id") === "eq.user-1") return json({}, 503);
      return underlying(url, options);
    });
    const result = await processMorningReminders(f.deps);
    expect(result.failed).toBe(1);
    expect(f.logs.map((log) => log.user_id)).toEqual(["user-2"]);
  });
});

describe("Telegram provider accounting", () => {
  it.each<[number, unknown, boolean]>([
    [503, { ok: true }, true], [429, { ok: false }, true],
    [400, { ok: true }, false], [200, { ok: false, error_code: 403, description: "SECRET" }, false],
  ])("checks HTTP %s and provider body", async (status, body, retryable) => {
    const f = fixture();
    f.provider(() => json(body, status));
    const result = await processMorningReminders(f.deps);
    expect(result.sent).toBe(0);
    expect(result.telegram.failureCount).toBe(1);
    expect(f.failures[0]?.p_retryable).toBe(retryable);
    expect(f.calls.some((call) => call.name === "complete_reminder_delivery")).toBe(false);
    expect(JSON.stringify([result, f.logs, f.failures])).not.toContain("SECRET");
  });
  it("records lost transport responses as unknown without automatic retry", async () => {
    const f = fixture();
    f.provider(() => { throw new Error("https://api.telegram.org/botSECRET/sendMessage"); });
    await processMorningReminders(f.deps);
    expect(f.failures[0]).toMatchObject({ p_retryable: false, p_last_error: "telegram_outcome_unknown" });
    expect(f.logs[0]).toMatchObject({ status: "failed", metadata: { outcome: "unknown" } });
  });
  it("retries a demonstrably pre-dispatch connection failure without persisting the raw error", async () => {
    const f = fixture();
    f.provider(() => { throw Object.assign(new Error("botSECRET"), { cause: { code: "ECONNREFUSED" } }); });
    await processMorningReminders(f.deps);
    expect(f.failures[0]).toMatchObject({ p_retryable: true, p_last_error: "telegram_pre_dispatch_failure" });
    expect(JSON.stringify(f.failures)).not.toContain("SECRET");
  });
});

describe("injected schedule and eligibility", () => {
  it("uses configured seconds and midnight hour zero", () => {
    const pref = preference({ morning_time: "08:00:30" });
    expect(eligiblePreference(pref, now)).toBe(false);
    expect(eligiblePreference(pref, new Date("2026-10-24T08:00:30Z"))).toBe(true);
    expect(localSchedule(new Date("2026-10-24T00:00:00Z"), "UTC")).toEqual({ date: "2026-10-24", seconds: 0 });
  });
  it("uses the user's local date across Tehran midnight and UTC year boundary", () => {
    expect(localSchedule(new Date("2026-12-31T20:29:59Z"), "Asia/Tehran").date).toBe("2026-12-31");
    expect(localSchedule(new Date("2026-12-31T20:30:00Z"), "Asia/Tehran")).toEqual({ date: "2027-01-01", seconds: 0 });
  });
  it("keeps claim and audit dates on the same injected reference instant", async () => {
    const f = fixture([preference({ timezone: "Asia/Tehran", morning_time: "00:00:00" })]);
    await processMorningReminders({ ...f.deps, now: new Date("2026-10-23T20:30:00Z") });
    expect(f.calls.find((call) => call.name === "claim_reminder_delivery")?.body.p_local_date).toBe("2026-10-24");
    expect(f.logs[0]?.local_date).toBe("2026-10-24");
  });
  it("includes open due/overdue Tasks and unpaid active Finance in the existing three-day window", async () => {
    const f = fixture();
    f.sources([task(), task({ id: "overdue", dueDate: "2026-10-01" }), task({ id: "done", status: "done" }),
      task({ id: "cancelled", status: "cancelled" }), task({ id: "future", dueDate: "2026-10-25" }), task({ id: "invalid", dueDate: "2026-02-30" })], [
      { payload: { id: "finance-1", title: "Due soon", status: "active", totalAmount: 100, paidAmount: 0, dueDate: "2026-10-27" } },
      { payload: { id: "paid", title: "Paid", status: "active", totalAmount: 100, paidAmount: 100, dueDate: "2026-10-24" } },
      { payload: { id: "inactive", title: "Inactive", status: "paid", totalAmount: 100, paidAmount: 0, dueDate: "2026-10-24" } },
    ]);
    const batch = await collectReminderItemsForUser("user-1", "2026-10-24", f.deps);
    expect(batch.task_due.map((item) => item.id)).toEqual(["task-1", "overdue"]);
    expect(batch.finance_obligation.map((item) => item.id)).toEqual(["finance-1"]);
  });
});

describe("final domain compatibility regressions", () => {
  it("matches the authoritative Task status set and the old terminal-status exclusions", async () => {
    const f = fixture();
    f.sources(TASK_STATUS_VALUES.map((status) => task({ id: status, status })), []);
    const batch = await collectReminderItemsForUser("user-1", "2026-10-24", f.deps);
    expect(batch.task_due.map((item) => item.id)).toEqual(TASK_STATUS_VALUES.filter((status) => status !== "done" && status !== "cancelled"));
  });
  it.each(["2026-01-30", "2026-02-27", "2028-02-28", "2026-12-30"])("preserves monthly labels and the inclusive window across %s", async (date) => {
    const f = fixture();
    const base = { title: "Monthly", status: "active", totalAmount: 100, paidAmount: 25 };
    f.sources([], [1, 2, 3, 15, 31].map((dueDay) => ({ payload: { ...base, id: `day-${dueDay}`, dueDay } })));
    const batch = await collectReminderItemsForUser("user-1", date, f.deps);
    const days = Array.from({ length: 4 }, (_, offset) => {
      const current = new Date(`${date}T00:00:00Z`);
      current.setUTCDate(current.getUTCDate() + offset);
      return current.getUTCDate();
    });
    expect(batch.finance_obligation).toEqual([1, 2, 3, 15, 31].filter((day) => days.includes(day)).map((day) => ({ id: `day-${day}`, title: "Monthly", date: `روز ${day} ماه` })));
    await processMorningReminders({ ...f.deps, now: new Date(`${date}T08:00:00Z`) });
    const send = f.fetchMock.mock.calls.find(([url]) => String(url).includes("api.telegram.org"));
    expect(JSON.parse(String(send?.[1]?.body)).text).toContain("روز 1 ماه");
  });
  it("keeps exact-date window edges, active/unpaid rules and the legacy OR when both dates exist", async () => {
    const f = fixture();
    const base = { title: "Finance", status: "active", totalAmount: 100, paidAmount: 25 };
    f.sources([], [
      { id: "today", dueDate: "2026-12-30" }, { id: "end", dueDate: "2027-01-02" },
      { id: "past", dueDate: "2026-12-29" }, { id: "outside", dueDate: "2027-01-03" },
      { id: "paused", dueDay: 1, status: "paused" }, { id: "paid", dueDay: 1, status: "paid" },
      { id: "settled", dueDay: 1, paidAmount: 100 }, { id: "overpaid", dueDay: 1, paidAmount: 110 },
      { id: "both", dueDate: "2027-01-15", dueDay: 1 },
    ].map((value) => ({ payload: { ...base, ...value } })));
    expect((await collectReminderItemsForUser("user-1", "2026-12-30", f.deps)).finance_obligation.map((item) => item.id)).toEqual(["today", "end", "both"]);
  });
  it("ignores real sync tombstones even when their previous record was due", async () => {
    const f = fixture();
    f.sources([{ record_id: "deleted", payload: { __aliosTombstone: true, deletedAt: now.toISOString(), previousRecord: task().payload } }], []);
    expect((await processMorningReminders(f.deps)).sent).toBe(0);
    expect(f.calls.some((call) => call.name === "claim_reminder_delivery")).toBe(false);
  });
  it.each([
    { rows: [{ record_id: "different", ...task() }] },
    { rows: [{ record_id: "task-1", ...task() }, { record_id: "task-1", ...task() }] },
  ])("rejects mismatched or duplicated sync identities before dispatch: %j", async ({ rows }) => {
    const f = fixture();
    f.sources(rows, []);
    expect((await processMorningReminders(f.deps)).ok).toBe(false);
    expect(f.calls.some((call) => call.name === "claim_reminder_delivery")).toBe(false);
  });
  it.each(["0-0/2", "1-1/1", "1-2/2"])("rejects ignored offsets, changing totals and inconsistent ranges: %s", async (secondRange) => {
    const f = fixture();
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (input, options) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("alios_sync_records")) {
        const offset = Number(url.searchParams.get("offset"));
        return new Response(JSON.stringify([{ record_id: `task-${offset}`, ...task({ id: `task-${offset}` }) }]), {
          headers: { "content-range": offset === 0 ? "0-0/2" : secondRange },
        });
      }
      return underlying(input, options);
    });
    expect((await processMorningReminders(f.deps)).ok).toBe(false);
    expect(f.calls.some((call) => call.name === "claim_reminder_delivery")).toBe(false);
  });
  it.each([
    { channel: "telegram", transport: false }, { channel: "web_push", transport: false },
    { channel: "telegram", transport: true }, { channel: "web_push", transport: true },
  ])("never reopens delivery after a secondary log failure: %j", async ({ channel, transport }) => {
    const f = fixture([preference({ channel })]);
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).includes("reminder_delivery_log")) {
        if (transport) throw new Error("audit transport unavailable");
        return json({}, 503);
      }
      return underlying(url, options);
    });
    const first = await processMorningReminders(f.deps);
    expect(first).toMatchObject({ ok: false, sent: 1, failed: 0 });
    expect(f.failures).toEqual([]);
    await processMorningReminders(f.deps);
    expect(f.sendWebPush).toHaveBeenCalledTimes(channel === "web_push" ? 1 : 0);
    expect(f.fetchMock.mock.calls.filter(([url]) => String(url).includes("api.telegram.org"))).toHaveLength(channel === "telegram" ? 1 : 0);
  });
  it.each(["throw", "false"])("does not downgrade accepted Telegram delivery to a retryable failure when completion returns %s", async (failure) => {
    const f = fixture();
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).endsWith("/complete_reminder_delivery")) {
        if (failure === "throw") throw new Error("database unavailable");
        return json(false);
      }
      return underlying(url, options);
    });
    expect((await processMorningReminders(f.deps)).ok).toBe(false);
    expect(f.failures).toEqual([]);
    expect(f.logs).toEqual([]);
    await processMorningReminders(f.deps);
    expect(f.fetchMock.mock.calls.filter(([url]) => String(url).includes("api.telegram.org"))).toHaveLength(1);
  });
});
