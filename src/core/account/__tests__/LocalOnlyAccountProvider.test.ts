import { describe, expect, it, vi } from "vitest";

import {
  LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY,
  localOnlyAccountProvider,
} from "../LocalOnlyAccountProvider";

describe("LocalOnlyAccountProvider", () => {
  it("keeps account identity unavailable by default", async () => {
    await expect(localOnlyAccountProvider.getStatus()).resolves.toBe(
      "local-only"
    );
    await expect(localOnlyAccountProvider.getCurrentIdentity()).resolves.toBe(
      null
    );
    await expect(localOnlyAccountProvider.getCurrentSession()).resolves.toEqual(
      LOCAL_ONLY_ACCOUNT_SESSION_BOUNDARY
    );
  });

  it("publishes the local-only session through subscriptions", () => {
    const listener = vi.fn();

    const subscription = localOnlyAccountProvider.subscribe(listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "local-only",
        providerId: "local-only",
        identity: null,
      })
    );
    expect(subscription.unsubscribe).toBeTypeOf("function");
  });
});
