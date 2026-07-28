import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoogleAccountProvider } from "@/core/account/GoogleAccountProvider";
import { GOOGLE_ACCOUNT_PROVIDER_ID } from "@/core/account/types";

import { GoogleAuthProvider } from "../GoogleAuthProvider";
import {
  GOOGLE_AUTH_STORAGE_KEY,
  createGoogleAuthRuntime,
} from "../googleAuthRuntime";

type GoogleCredentialResponse = Readonly<{
  credential?: string;
}>;

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createGoogleCredential(payload: Record<string, unknown>) {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function createGoogleSdkHarness() {
  let credentialCallback: ((response: GoogleCredentialResponse) => void) | null =
    null;

  const sdk = {
    initialize: vi.fn((config: { callback: (response: GoogleCredentialResponse) => void }) => {
      credentialCallback = config.callback;
    }),
    prompt: vi.fn(),
    renderButton: vi.fn(),
    disableAutoSelect: vi.fn(),
    revoke: vi.fn((_email: string, callback?: () => void) => {
      callback?.();
    }),
  };

  return {
    sdk,
    emitCredential(response: GoogleCredentialResponse) {
      if (!credentialCallback) {
        throw new Error("Google SDK was not initialized before emitting a credential.");
      }

      credentialCallback(response);
    },
  };
}

async function waitForGooglePrompt(
  promptSpy: ReturnType<typeof vi.fn>,
  attempts = 10
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (promptSpy.mock.calls.length > 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe("GoogleAuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the runtime signed out when no Google client ID is configured", async () => {
    const runtime = createGoogleAuthRuntime(
      {},
      {
        getStorage: () => localStorage,
      }
    );
    const provider = new GoogleAuthProvider(runtime);

    await expect(provider.getCurrentSession()).resolves.toMatchObject({
      status: "unauthenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: null,
    });

    await expect(provider.login({})).rejects.toThrow(
      "Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured."
    );
  });

  it("stores a real Google sign-in result without persisting the raw credential token", async () => {
    const harness = createGoogleSdkHarness();
    const now = new Date("2026-07-28T09:30:00.000Z");
    const runtime = createGoogleAuthRuntime(
      {
        clientId: "google-client-id",
      },
      {
        loadSdk: async () => harness.sdk,
        now: () => now,
        getStorage: () => localStorage,
      }
    );
    const authProvider = new GoogleAuthProvider(runtime);
    const accountProvider = new GoogleAccountProvider(runtime);
    const loginPromise = authProvider.login({});
    await waitForGooglePrompt(harness.sdk.prompt);

    expect(await authProvider.getCurrentSession()).toMatchObject({
      status: "authenticating",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
    });

    expect(harness.sdk.prompt).toHaveBeenCalledTimes(1);

    harness.emitCredential({
      credential: createGoogleCredential({
        sub: "google-user-1",
        email: "user@gmail.com",
        name: "AliOS User",
        picture: "https://example.com/avatar.png",
        iat: Math.floor(now.getTime() / 1000),
        exp: Math.floor(now.getTime() / 1000) + 3600,
      }),
    });

    await expect(loginPromise).resolves.toMatchObject({
      session: {
        status: "authenticated",
        provider: GOOGLE_ACCOUNT_PROVIDER_ID,
        user: {
          userId: "google-user-1",
          email: "user@gmail.com",
          displayName: "AliOS User",
        },
      },
    });

    const storedSession = localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
    expect(storedSession).toContain("google-user-1");
    expect(storedSession).not.toContain(".signature");

    await expect(authProvider.getCurrentSession()).resolves.toMatchObject({
      status: "authenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: {
        userId: "google-user-1",
        email: "user@gmail.com",
        displayName: "AliOS User",
      },
    });

    await expect(accountProvider.getCurrentSession()).resolves.toMatchObject({
      status: "authenticated",
      providerId: GOOGLE_ACCOUNT_PROVIDER_ID,
      lifecycle: "signed-in",
      identity: {
        accountId: "google-user-1",
        email: "user@gmail.com",
        displayName: "AliOS User",
      },
    });
  });

  it("signs out cleanly and removes the stored Google session snapshot", async () => {
    const harness = createGoogleSdkHarness();
    const runtime = createGoogleAuthRuntime(
      {
        clientId: "google-client-id",
      },
      {
        loadSdk: async () => harness.sdk,
        getStorage: () => localStorage,
      }
    );
    const provider = new GoogleAuthProvider(runtime);

    const loginPromise = provider.login({});
    await waitForGooglePrompt(harness.sdk.prompt);
    harness.emitCredential({
      credential: createGoogleCredential({
        sub: "google-user-2",
        email: "person@gmail.com",
        name: "Second User",
        exp: Math.floor(new Date("2026-07-28T12:00:00.000Z").getTime() / 1000),
      }),
    });
    await loginPromise;

    await provider.logout();

    expect(localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY)).toBeNull();
    expect(harness.sdk.disableAutoSelect).toHaveBeenCalledTimes(1);
    expect(harness.sdk.revoke).toHaveBeenCalledWith(
      "person@gmail.com",
      expect.any(Function)
    );

    await expect(provider.getCurrentSession()).resolves.toMatchObject({
      status: "unauthenticated",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: null,
    });
  });
});
