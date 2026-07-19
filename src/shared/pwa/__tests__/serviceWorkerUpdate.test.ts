import { describe, expect, it, vi } from "vitest";

import { checkForServiceWorkerUpdate } from "../serviceWorkerUpdate";

describe("checkForServiceWorkerUpdate", () => {
  it("reports unsupported environments without accessing a browser API", async () => {
    await expect(checkForServiceWorkerUpdate(undefined)).resolves.toBe("unsupported");
  });

  it("checks an existing registration without forcing activation", async () => {
    const update = vi.fn().mockResolvedValue(undefined);

    await expect(
      checkForServiceWorkerUpdate({
        getRegistration: vi.fn().mockResolvedValue({ update }),
      })
    ).resolves.toBe("checked");

    expect(update).toHaveBeenCalledOnce();
  });

  it("keeps unavailable and failed registrations distinct", async () => {
    await expect(
      checkForServiceWorkerUpdate({
        getRegistration: vi.fn().mockResolvedValue(undefined),
      })
    ).resolves.toBe("notRegistered");

    await expect(
      checkForServiceWorkerUpdate({
        getRegistration: vi.fn().mockRejectedValue(new Error("offline")),
      })
    ).resolves.toBe("failed");
  });
});
