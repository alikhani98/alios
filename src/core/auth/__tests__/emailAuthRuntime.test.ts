import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmailAuthRuntime } from "@/core/auth/emailAuthRuntime";
import {
  createSupabaseBrowserClient,
  type SupabaseSession,
} from "@/core/sync/supabaseClient";

function encodeBase64Url(value: string) {
  const encoded =
    typeof btoa === "function"
      ? btoa(value)
      : Buffer.from(value, "utf8").toString("base64");

  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createAccessToken(overrides: Record<string, unknown> = {}) {
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: "user-1",
      email: "user@example.com",
      user_metadata: {
        email: "user@example.com",
        display_name: "AliOS User",
      },
      exp: Math.floor(new Date("2026-08-01T12:00:00.000Z").getTime() / 1000),
      ...overrides,
    })
  );

  return `${header}.${payload}.signature`;
}

function readStoredSession(storageKey: string): SupabaseSession | null {
  const raw = localStorage.getItem(storageKey);
  return raw ? (JSON.parse(raw) as SupabaseSession) : null;
}

describe("EmailAuthRuntime auth callback handling", () => {
  const storageKey = "test.supabase.auth";
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  function installBrowserStubs(hash: string) {
    let pathname = "/";
    let search = "";
    let currentHash = hash;

    const history = {
      state: null,
      replaceState: vi.fn((_state: unknown, _title: string, url?: string | URL | null) => {
        const nextValue = typeof url === "string" ? url : url?.toString() ?? "";
        const [pathWithSearch, nextHash = ""] = nextValue.split("#");
        const [nextPathname = "/", nextSearch = ""] = pathWithSearch.split("?");
        pathname = nextPathname || "/";
        search = nextSearch ? `?${nextSearch}` : "";
        currentHash = nextHash ? `#${nextHash}` : "";
      }),
    };

    vi.stubGlobal("window", {
      localStorage,
      location: {
        get pathname() {
          return pathname;
        },
        get search() {
          return search;
        },
        get hash() {
          return currentHash;
        },
      },
      history,
    });
    vi.stubGlobal("document", {
      title: "AliOS",
    });

    return history;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalWindow !== undefined) {
      vi.stubGlobal("window", originalWindow);
    }

    if (originalDocument !== undefined) {
      vi.stubGlobal("document", originalDocument);
    }
  });

  it("restores a signup confirmation session from the Supabase auth hash and clears the URL", async () => {
    const accessToken = createAccessToken();
    const refreshToken = "refresh-token";
    const history = installBrowserStubs(
      `#access_token=${accessToken}&refresh_token=${refreshToken}&type=signup`
    );

    const client = createSupabaseBrowserClient(
      "https://example.supabase.co",
      "anon-key",
      storageKey
    );
    const runtime = new EmailAuthRuntime({
      client,
      now: () => new Date("2026-07-31T08:00:00.000Z"),
    });

    await expect(runtime.getSession()).resolves.toMatchObject({
      status: "authenticated",
      user: {
        userId: "user-1",
        email: "user@example.com",
        displayName: "AliOS User",
      },
    });

    expect(readStoredSession(storageKey)).toMatchObject({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: "user-1",
        user_metadata: {
          email: "user@example.com",
          display_name: "AliOS User",
        },
      },
    });
    expect(history.replaceState).toHaveBeenCalledWith(null, "AliOS", "/");
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/");
  });
});
