import { describe, expect, it, vi } from "vitest";
import { sendWebPushNotifications } from "./webPushSenderCore";
import type { ProviderOutcome } from "./deliveryTypes";
const payload = { version: 1, title: "Reminder", body: "1 task", url: "/#/today" };
const claim = { claimed: true, attempt_id: "attempt-1", attempt_count: 1, lease_token: "lease-1",
  status: "processing", retryable: true, next_attempt_at: null, last_error: null };
const json = (value: unknown) => new Response(JSON.stringify(value), {
  headers: Array.isArray(value) ? { "content-range": value.length ? `0-${value.length - 1}/${value.length}` : "*/0" } : {},
});

function fixture(outcomes: ProviderOutcome[]) {
  const states = ["pending", "pending"];
  const finished: Record<string, unknown>[] = [];
  let deny = false;
  let rejectFinish = false;
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const name = new URL(String(input)).pathname.split("/").at(-1);
    const body = JSON.parse(String(options?.body)) as Record<string, unknown>;
    expect(body.p_user_id).toBe("user-1");
    expect(body.p_attempt_id).toBe("attempt-1");
    expect(body.p_lease_token).toBe("lease-1");
    if (name === "list_reminder_push_targets") return json([{ target_id: "0" }, { target_id: "1" }]);
    const index = Number(body.p_target_id);
    if (name === "begin_reminder_push_target") {
      if (deny || !["pending", "retryable_failure"].includes(states[index])) return json(null);
      states[index] = "processing";
      return json({ endpoint: `https://push.example.test/${index}`, p256dh: "fake-key", auth: "fake-secret", user_agent: null });
    }
    if (name === "finish_reminder_push_target") {
      if (rejectFinish) throw new Error("token-bearing URL https://push.example.test/SECRET");
      finished.push(body);
      states[index] = String(body.p_outcome);
      return json(true);
    }
    throw new Error("unexpected RPC");
  });
  const send = vi.fn(async (): Promise<ProviderOutcome> => outcomes.shift() ?? { ok: true, status: 201 });
  const deps = { supabaseUrl: "https://db.example.test", supabaseServiceKey: "fake-service", fetch: fetchMock, send };
  return { deps, states, send, finished, fetchMock,
    deny: () => { deny = true; }, rejectFinish: () => { rejectFinish = true; } };
}
describe("per-device push delivery contract", () => {
  it("reads every server-capped RPC page before authorizing any device", async () => {
    const f = fixture([{ ok: true, status: 201 }, { ok: false, status: 503 }]);
    const underlying = f.deps.fetch;
    const offsets: number[] = [];
    f.deps.fetch = vi.fn<typeof fetch>(async (input, options) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("list_reminder_push_targets")) {
        expect(f.send).not.toHaveBeenCalled();
        expect(url.searchParams.get("order")).toBe("target_id.asc");
        expect(new Headers(options?.headers).get("prefer")).toBe("count=exact");
        const offset = Number(url.searchParams.get("offset"));
        offsets.push(offset);
        return new Response(JSON.stringify([{ target_id: String(offset) }]), { headers: { "content-range": `${offset}-${offset}/2` } });
      }
      return underlying(input, options);
    });
    expect(await sendWebPushNotifications("user-1", payload, claim, f.deps)).toMatchObject({ successCount: 1, failureCount: 1 });
    expect(offsets).toEqual([0, 1]);
    expect(f.states).toEqual(["sent", "retryable_failure"]);
  });
  it("does not dispatch an incomplete RPC list without an exact total", async () => {
    const f = fixture([]);
    const underlying = f.deps.fetch;
    f.deps.fetch = vi.fn<typeof fetch>(async (input, options) => {
      if (String(input).includes("list_reminder_push_targets")) return new Response(JSON.stringify([{ target_id: "0" }]));
      return underlying(input, options);
    });
    await expect(sendWebPushNotifications("user-1", payload, claim, f.deps)).rejects.toThrow("reminder_source_incomplete");
    expect(f.send).not.toHaveBeenCalled();
  });
  it("keeps success and retryable failure separate, and retries only the failed device", async () => {
    const f = fixture([{ ok: true, status: 201 }, { ok: false, status: 503 }, { ok: true, status: 201 }]);
    const first = await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(first).toMatchObject({ successCount: 1, failureCount: 1 });
    expect(f.states).toEqual(["sent", "retryable_failure"]);
    const second = await sendWebPushNotifications("user-1", payload, { ...claim, attempt_count: 2 }, f.deps);
    expect(second).toMatchObject({ successCount: 1, failureCount: 0 });
    expect(f.send).toHaveBeenCalledTimes(3);
    expect(f.finished.map((body) => [body.p_target_id, body.p_outcome])).toEqual([
      ["0", "sent"], ["1", "retryable_failure"], ["1", "sent"],
    ]);
    await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.send).toHaveBeenCalledTimes(3);
  });
  it.each([404, 410, 400, 401, 403, 413])("records HTTP %s as permanent failure, never success", async (status) => {
    const f = fixture([{ ok: false, status }, { ok: false, status }]);
    const result = await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(2);
    expect(result.removedCount).toBe(status === 404 || status === 410 ? 2 : 0);
    expect(f.finished.every((body) => body.p_outcome === "permanent_failure")).toBe(true);
    await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.send).toHaveBeenCalledTimes(2);
  });
  it.each([429, 500, 503])("classifies known HTTP %s rejection as retryable", async (status) => {
    const f = fixture([{ ok: false, status }, { ok: false, status }]);
    await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.finished.every((body) => body.p_outcome === "retryable_failure")).toBe(true);
  });
  it("rejects an adapter's ok result with an unsuccessful HTTP status", async () => {
    const f = fixture([{ ok: true, status: 500 }, { ok: true, status: 400 }]);
    expect((await sendWebPushNotifications("user-1", payload, claim, f.deps)).successCount).toBe(0);
  });
  it("records ambiguous network outcomes as unknown and never retries them", async () => {
    const f = fixture([]);
    f.send.mockRejectedValue(new Error("auth=SECRET https://push.example.test/private"));
    const result = await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.states).toEqual(["unknown", "unknown"]);
    expect(JSON.stringify([result, f.finished])).not.toContain("SECRET");
    await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.send).toHaveBeenCalledTimes(2);
  });
  it.each(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH"])("safely retries a pre-dispatch %s failure without inventing an HTTP response", async (code) => {
    const f = fixture([]);
    f.send.mockRejectedValue(Object.assign(new Error("SECRET endpoint"), { cause: { code } }));
    const result = await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.states).toEqual(["retryable_failure", "retryable_failure"]);
    expect(f.finished.every((body) => body.p_http_status === null)).toBe(true);
    expect(result.errors).toEqual(["web_push_pre_dispatch_failure", "web_push_pre_dispatch_failure"]);
    expect(JSON.stringify([result, f.finished])).not.toContain("SECRET");
  });
  it.each(["ECONNRESET", "ETIMEDOUT", "UND_ERR_SOCKET"])("keeps potentially accepted %s transport failures unknown", async (code) => {
    const f = fixture([]);
    f.send.mockRejectedValue(Object.assign(new Error("lost response"), { cause: { code } }));
    await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.states).toEqual(["unknown", "unknown"]);
  });
  it("does not send after authorization is suppressed by a preference change or stale lease", async () => {
    const f = fixture([]);
    f.deny();
    await sendWebPushNotifications("user-1", payload, claim, f.deps);
    expect(f.send).not.toHaveBeenCalled();
  });
  it("stops after a database outcome-write failure rather than replaying accepted delivery", async () => {
    const f = fixture([{ ok: true, status: 201 }]);
    f.rejectFinish();
    await expect(sendWebPushNotifications("user-1", payload, claim, f.deps)).rejects.toThrow("reminder_state_unavailable");
    expect(f.send).toHaveBeenCalledTimes(1);
    expect(f.states[0]).toBe("processing"); // SQL finalization/lease recovery makes this unknown.
  });
});
