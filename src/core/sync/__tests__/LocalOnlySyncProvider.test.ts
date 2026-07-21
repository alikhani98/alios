import { describe, expect, it } from "vitest";

import { localOnlySyncProvider } from "../LocalOnlySyncProvider";

describe("LocalOnlySyncProvider", () => {
  it("reports the safe local-only state without remote activity", async () => {
    await expect(localOnlySyncProvider.getStatus()).resolves.toMatchObject({
      mode: "local-only",
      provider: "local-only",
    });
    await expect(localOnlySyncProvider.syncNow()).resolves.toMatchObject({
      changedRecords: 0,
      status: { mode: "local-only" },
    });
  });
});
