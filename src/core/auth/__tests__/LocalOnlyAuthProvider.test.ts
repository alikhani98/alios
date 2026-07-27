import { describe, expect, it, vi } from "vitest";

import { localOnlyAuthProvider } from "../LocalOnlyAuthProvider";

describe("LocalOnlyAuthProvider", () => {
  it("reports the safe unauthenticated local-only state", async () => {
    await expect(localOnlyAuthProvider.getCurrentUser()).resolves.toBeNull();
    await expect(localOnlyAuthProvider.getCurrentSession()).resolves.toMatchObject({
      status: "unauthenticated",
      provider: "local-only",
      user: null,
    });
    await expect(localOnlyAuthProvider.refreshSession()).resolves.toMatchObject({
      status: "unauthenticated",
      provider: "local-only",
    });
  });

  it("rejects login while authentication is not enabled", async () => {
    await expect(localOnlyAuthProvider.login({ email: "user@example.com" })).rejects.toThrow(
      "Authentication is not enabled in AliOS 1.0."
    );
  });

  it("supports auth state subscription without mutating runtime state", () => {
    const listener = vi.fn();

    const subscription = localOnlyAuthProvider.subscribe(listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "unauthenticated",
        provider: "local-only",
      })
    );

    expect(subscription.unsubscribe).toBeTypeOf("function");
    subscription.unsubscribe();
  });
});
