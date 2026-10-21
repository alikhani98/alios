import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("catalog request caching", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("MODE", "development");
  });
  afterEach(() => {
    vi.doUnmock("../messages.fa"); vi.doUnmock("../messages.en");
    vi.unstubAllEnvs(); vi.resetModules();
  });
  it("does not preload either catalog, and shares one pending request", async () => {
    const module = await vi.importActual<typeof import("../messages.fa")>("../messages.fa");
    let resolve!: () => void;
    const gate = new Promise<void>(complete => { resolve = complete; });
    const factory = vi.fn(async () => { await gate; return module; });
    vi.doMock("../messages.fa", factory);
    const { getLoadedMessages, loadMessages } = await import("../i18n");
    expect(getLoadedMessages("en")).toBeNull(); expect(getLoadedMessages("fa")).toBeNull();
    const first = loadMessages("fa"); const second = loadMessages("fa");
    resolve(); await expect(first).resolves.toBe(module.messagesFa); await expect(second).resolves.toBe(module.messagesFa);
    expect(factory).toHaveBeenCalledTimes(1); expect(getLoadedMessages("fa")).toBe(module.messagesFa);
    await expect(loadMessages("fa")).resolves.toBe(module.messagesFa); expect(factory).toHaveBeenCalledTimes(1);
  });
  it("does not cache a rejected request permanently when the module source recovers", async () => {
    const module = await vi.importActual<typeof import("../messages.fa")>("../messages.fa");
    vi.doMock("../messages.fa", () => { throw new Error("catalog temporarily unavailable"); });
    const { getLoadedMessages, loadMessages } = await import("../i18n");
    await expect(loadMessages("fa")).rejects.toMatchObject({ cause: { message: "catalog temporarily unavailable" } });
    expect(getLoadedMessages("fa")).toBeNull();
    // Model recovery at the module boundary, without recreating the i18n loader.
    vi.doMock("../messages.fa", () => module);
    await expect(loadMessages("fa")).resolves.toBe(module.messagesFa);
    expect(getLoadedMessages("fa")).toBe(module.messagesFa);
  });
});
