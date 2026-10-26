import { describe, expect, it, vi } from "vitest";
import { handleSchedulerRequest } from "./http";
import { emptyDeliveryResult } from "./deliveryTypes";
const deps = { supabaseUrl: "https://db.example.test", supabaseServiceKey: "fake-service-secret",
  telegramBotToken: "fake-bot", fetch: vi.fn<typeof fetch>() };
const result = { ok: true, message: "processed", processed: 0, sent: 0, failed: 0,
  telegram: emptyDeliveryResult(), web_push: emptyDeliveryResult() };
describe("scheduler invocation authorization", () => {
  it.each([undefined, "Bearer user-jwt", "Bearer anon-key", "Bearer wrong", "Basic fake-service-secret"])("rejects unauthorized header %s before processing", async (authorization) => {
    const process = vi.fn().mockResolvedValue(result);
    const response = await handleSchedulerRequest(new Request("https://scheduler.example.test", {
      method: "POST", headers: authorization ? { authorization } : {},
    }), deps, process);
    expect(response.status).toBe(401);
    expect(process).not.toHaveBeenCalled();
    expect(deps.fetch).not.toHaveBeenCalled();
  });
  it("accepts only the configured service bearer and POST", async () => {
    const process = vi.fn().mockResolvedValue(result);
    const headers = { authorization: "Bearer fake-service-secret" };
    expect((await handleSchedulerRequest(new Request("https://scheduler.example.test", { method: "POST", headers }), deps, process)).status).toBe(200);
    expect((await handleSchedulerRequest(new Request("https://scheduler.example.test", { headers }), deps, process)).status).toBe(405);
    expect(process).toHaveBeenCalledTimes(1);
  });
  it("fails closed with missing configuration", async () => {
    const process = vi.fn().mockResolvedValue(result);
    expect((await handleSchedulerRequest(new Request("https://scheduler.example.test", { method: "POST" }), { ...deps, supabaseServiceKey: "" }, process)).status).toBe(503);
    expect(process).not.toHaveBeenCalled();
  });
  it("sanitizes top-level errors without logging request headers or URLs", async () => {
    const process = vi.fn().mockRejectedValue(new Error("SECRET https://push.example.test/token"));
    const response = await handleSchedulerRequest(new Request("https://scheduler.example.test", {
      method: "POST", headers: { authorization: "Bearer fake-service-secret" },
    }), deps, process);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("SECRET");
  });
});
