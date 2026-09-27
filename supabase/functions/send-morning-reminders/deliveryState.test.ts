import { describe, expect, it, vi } from "vitest";

import {
  claimReminderDelivery,
  completeReminderDelivery,
  failReminderDelivery,
} from "./deliveryState";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const dependencies = (fetch: typeof globalThis.fetch) => ({
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceKey: "service-role",
  fetch,
});

const claim = {
  claimed: true,
  attempt_id: "attempt-1",
  attempt_count: 1,
  lease_token: "lease-1",
  status: "processing",
  retryable: true,
  next_attempt_at: null,
  last_error: null,
};

describe("reminder delivery state client", () => {
  it("sends an atomic claim request with a lease", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([claim])
    );
    const now = new Date("2026-09-27T08:00:00.000Z");

    await expect(
      claimReminderDelivery(
        "user-1",
        "telegram",
        "2026-09-27",
        now,
        dependencies(fetchMock)
      )
    ).resolves.toEqual(claim);

    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/rest/v1/rpc/claim_reminder_delivery");
    expect(JSON.parse(String(options?.body))).toMatchObject({
      p_user_id: "user-1",
      p_channel: "telegram",
      p_local_date: "2026-09-27",
      p_now: now.toISOString(),
    });
  });

  it("uses bounded backoff for retryable failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(true));

    await expect(
      failReminderDelivery(
        claim,
        { retryable: true, error: "temporary provider failure" },
        new Date("2026-09-27T08:00:00.000Z"),
        dependencies(fetchMock)
      )
    ).resolves.toBe(true);

    const [, options] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String(options?.body));
    expect(body.p_retryable).toBe(true);
    expect(body.p_next_attempt_at).toBe("2026-09-27T08:05:00.000Z");
  });

  it("completes only the claimed lease", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(true)
    );

    await expect(
      completeReminderDelivery(
        claim,
        new Date("2026-09-27T08:00:00.000Z"),
        dependencies(fetchMock)
      )
    ).resolves.toBe(true);

    const [, options] = fetchMock.mock.calls[0] ?? [];
    expect(JSON.parse(String(options?.body))).toEqual({
      p_attempt_id: "attempt-1",
      p_lease_token: "lease-1",
      p_now: "2026-09-27T08:00:00.000Z",
    });
  });
});
