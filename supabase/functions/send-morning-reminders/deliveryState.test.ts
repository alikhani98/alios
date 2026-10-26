import { describe, expect, it, vi } from "vitest";
import { claimReminderDelivery, completeReminderDelivery, failReminderDelivery } from "./deliveryState";
const now = new Date("2026-10-24T08:00:00Z");
const claim = { claimed: true, attempt_id: "attempt-1", attempt_count: 1, lease_token: "lease-1",
  status: "processing", retryable: true, next_attempt_at: null, last_error: null };
function fixture(value: unknown = true, status = 200) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(value), { status }));
  return { fetchMock, deps: { supabaseUrl: "https://db.example.test", supabaseServiceKey: "fake-service", fetch: fetchMock } };
}
describe("delivery state RPC boundary", () => {
  it("includes channel, local date and a bounded lease in the atomic claim", async () => {
    const f = fixture([claim]);
    await expect(claimReminderDelivery("user-1", "web_push", "2026-10-24", now, f.deps)).resolves.toEqual(claim);
    expect(JSON.parse(String(f.fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      p_user_id: "user-1", p_channel: "web_push", p_local_date: "2026-10-24",
      p_now: now.toISOString(), p_lease_until: "2026-10-24T08:10:00.000Z",
    });
  });
  it.each([[1, 5], [2, 15], [3, 60], [4, 360]])("preserves attempt %s backoff of %s minutes", async (attempt, minutes) => {
    const f = fixture();
    await failReminderDelivery({ ...claim, attempt_count: attempt }, { retryable: true, error: "telegram_http_503" }, now, f.deps);
    expect(JSON.parse(String(f.fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      p_retryable: true, p_next_attempt_at: new Date(now.getTime() + minutes * 60_000).toISOString(),
    });
  });
  it("does not schedule attempt six", async () => {
    const f = fixture();
    await failReminderDelivery({ ...claim, attempt_count: 5 }, { retryable: true, error: "telegram_http_503" }, now, f.deps);
    expect(JSON.parse(String(f.fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ p_retryable: false, p_next_attempt_at: null });
  });
  it("does not treat rejected lease completion as success", async () => {
    const f = fixture(false);
    expect(await completeReminderDelivery(claim, now, f.deps)).toBe(false);
    expect(await completeReminderDelivery({ ...claim, lease_token: null }, now, f.deps)).toBe(false);
    expect(f.fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed/multiple claims and claims without a lease", async () => {
    for (const value of [[claim, claim], [{ ...claim, lease_token: null }], [{ ...claim, attempt_count: 6 }], null]) {
      const f = fixture(value);
      await expect(claimReminderDelivery("user-1", "telegram", "2026-10-24", now, f.deps)).rejects.toThrow("reminder_claim_invalid");
    }
  });
  it("never persists raw provider error details", async () => {
    const f = fixture();
    await failReminderDelivery(claim, { retryable: false, error: "https://api.telegram.org/botSECRET/sendMessage" }, now, f.deps);
    expect(String(f.fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("SECRET");
  });
  it("never exposes database response bodies or transport exception messages", async () => {
    const f = fixture({ message: "SECRET" }, 500);
    await expect(claimReminderDelivery("user-1", "telegram", "2026-10-24", now, f.deps)).rejects.toThrow("reminder_state_unavailable");
  });
});
