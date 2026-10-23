// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogRetryUrl } from "../catalogRetry";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); vi.doUnmock("../messages.fa"); vi.doUnmock("../catalogRetry"); });

describe("browser catalog retry URLs", () => {
  function production(manifest: unknown, status = 200) {
    vi.stubEnv("DEV", false);
    vi.stubEnv("BASE_URL", "/alios/");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(manifest), { status })));
  }
  it("keeps the static deployment base and changes the module identity on each retry", async () => {
    production({ "src/shared/i18n/messages.fa.ts": { file: "assets/i18n-fa-hash.js" } });
    const first = new URL(await getCatalogRetryUrl("fa", 1));
    const second = new URL(await getCatalogRetryUrl("fa", 2));
    expect(first.pathname).toBe("/alios/assets/i18n-fa-hash.js");
    expect(first.searchParams.get("alios-language-retry")).toBe("1");
    expect(second.searchParams.get("alios-language-retry")).toBe("2");
    expect(first.href).not.toBe(second.href);
  });
  it.each([{}, null, { "src/shared/i18n/messages.fa.ts": { file: "https://other.invalid/catalog.js" } }, { "src/shared/i18n/messages.fa.ts": { file: "../catalog.js" } }])("rejects a missing or out-of-scope catalog mapping: %j", async manifest => {
    production(manifest);
    await expect(getCatalogRetryUrl("fa", 1)).rejects.toBeDefined();
  });
  it("reports an unavailable manifest without attempting a catalog URL", async () => {
    production({}, 503);
    await expect(getCatalogRetryUrl("en", 1)).rejects.toThrow("Language manifest unavailable");
  });
  it("uses the fresh URL loader after a native import remains rejected and permits further retries", async () => {
    vi.resetModules();
    const retry = vi.fn().mockRejectedValueOnce(new Error("still offline")).mockResolvedValueOnce({ "settings.copyError": "Recovered" });
    vi.doMock("../catalogRetry", () => ({ loadRetryCatalog: retry }));
    vi.doMock("../messages.fa", () => { throw new Error("sticky native failure"); });
    const { loadMessages } = await import("../i18n");
    await expect(loadMessages("fa")).rejects.toBeDefined();
    expect(retry).not.toHaveBeenCalled();
    await expect(loadMessages("fa")).rejects.toThrow("still offline");
    await expect(loadMessages("fa")).resolves.toEqual({ "settings.copyError": "Recovered" });
    expect(retry.mock.calls).toEqual([["fa", 1], ["fa", 2]]);
  });
});
