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
      exp: futureExpirySeconds(),
      ...overrides,
    })
  );

  return `${header}.${payload}.signature`;
}

function readStoredSession(storageKey: string): SupabaseSession | null {
  const raw = localStorage.getItem(storageKey);
  return raw ? (JSON.parse(raw) as SupabaseSession) : null;
}

function toUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function futureExpirySeconds() {
  return toUnixSeconds(new Date(Date.now() + 60 * 60 * 1000));
}

function pastExpirySeconds() {
  return toUnixSeconds(new Date(Date.now() - 60 * 60 * 1000));
}

function createSessionPayload(
  overrides: Partial<SupabaseSession> = {}
): SupabaseSession {
  return {
    access_token: createAccessToken(),
    refresh_token: "refresh-token",
    expires_at: futureExpirySeconds(),
    user: {
      id: "user-1",
      user_metadata: {
        email: "user@example.com",
        display_name: "AliOS User",
      },
    },
    ...overrides,
  };
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("EmailAuthRuntime auth callback handling", () => {
  const storageKey = "test.supabase.auth";
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;

  function installBrowserStubs(
    hash: string,
    storage: Storage | Pick<Storage, "getItem" | "setItem" | "removeItem"> = localStorage
  ) {
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
      localStorage: storage,
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

    if (originalFetch !== undefined) {
      vi.stubGlobal("fetch", originalFetch);
    }
  });

  it("writes a recoverable session on password sign-in and restores it in a fresh runtime", async () => {
    installBrowserStubs("");
    const fetchMock = vi.fn(async () => createJsonResponse(createSessionPayload()));
    vi.stubGlobal("fetch", fetchMock);

    const runtime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey
      ),
      now: () => new Date("2026-07-31T09:00:00.000Z"),
    });
    const runtimeStatuses: string[] = [];
    runtime.subscribe((session) => {
      runtimeStatuses.push(session.status);
    });

    await expect(
      runtime.login({
        email: "user@example.com",
        password: "secret123",
      })
    ).resolves.toMatchObject({
      session: {
        status: "authenticated",
        user: {
          userId: "user-1",
          email: "user@example.com",
        },
      },
    });

    expect(runtimeStatuses[0]).toBe("authenticating");
    expect(readStoredSession(storageKey)).toMatchObject({
      user: {
        id: "user-1",
      },
      refresh_token: "refresh-token",
    });

    const restoredRuntime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey
      ),
      now: () => new Date("2026-07-31T09:05:00.000Z"),
    });
    const restoredStatuses: string[] = [];
    restoredRuntime.subscribe((session) => {
      restoredStatuses.push(session.status);
    });

    await expect(restoredRuntime.getSession()).resolves.toMatchObject({
      status: "authenticated",
      user: {
        userId: "user-1",
        email: "user@example.com",
      },
    });

    expect(restoredStatuses[0]).toBe("authenticating");
    expect(restoredStatuses.at(-1)).toBe("authenticated");
  });

  it("keeps authenticated timestamps stable when the same stored session is restored repeatedly", async () => {
    installBrowserStubs("");
    localStorage.setItem(storageKey, JSON.stringify(createSessionPayload()));
    let currentTime = new Date("2026-07-31T10:00:00.000Z");

    const runtime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey
      ),
      now: () => currentTime,
    });

    const firstSession = await runtime.getSession();
    currentTime = new Date("2026-07-31T10:05:00.000Z");
    const secondSession = await runtime.getSession();

    expect(firstSession.status).toBe("authenticated");
    expect(secondSession.status).toBe("authenticated");
    expect(firstSession.user?.createdAt).toBe(secondSession.user?.createdAt);
    expect(firstSession.user?.updatedAt).toBe(secondSession.user?.updatedAt);
  });

  it("does not finalize authenticated state when session persistence fails", async () => {
    const failingStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
      removeItem: vi.fn(() => undefined),
    };
    installBrowserStubs("", failingStorage);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => createJsonResponse(createSessionPayload()))
    );

    const runtime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey,
        { storage: failingStorage }
      ),
      now: () => new Date("2026-07-31T09:15:00.000Z"),
    });
    const seenStatuses: string[] = [];
    runtime.subscribe((session) => {
      seenStatuses.push(session.status);
    });

    await expect(
      runtime.login({
        email: "user@example.com",
        password: "secret123",
      })
    ).rejects.toThrow("AliOS could not persist the email session on this device.");

    expect(seenStatuses).not.toContain("authenticated");
    await expect(runtime.getSession()).resolves.toMatchObject({
      status: "unauthenticated",
      user: null,
    });
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

  it("refreshes an expired persisted session during hydration", async () => {
    installBrowserStubs("");
    const expiredSession = createSessionPayload({
      access_token: createAccessToken({
        exp: pastExpirySeconds(),
      }),
      expires_at: pastExpirySeconds(),
      refresh_token: "refresh-token-expired",
    });
    localStorage.setItem(storageKey, JSON.stringify(expiredSession));

    const refreshedSession = createSessionPayload({
      access_token: createAccessToken({
        exp: futureExpirySeconds(),
      }),
      expires_at: futureExpirySeconds(),
      refresh_token: "refresh-token-fresh",
    });
    const fetchMock = vi.fn(async () => createJsonResponse(refreshedSession));
    vi.stubGlobal("fetch", fetchMock);

    const runtime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey
      ),
      now: () => new Date("2026-07-31T09:30:00.000Z"),
    });

    await expect(runtime.getSession()).resolves.toMatchObject({
      status: "authenticated",
      user: {
        userId: "user-1",
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readStoredSession(storageKey)).toMatchObject({
      refresh_token: "refresh-token-fresh",
    });
  });

  it("clears the persisted session on explicit sign-out", async () => {
    installBrowserStubs("");
    const fetchMock = vi
      .fn(async (input: string) =>
        input.includes("grant_type=password")
          ? createJsonResponse(createSessionPayload())
          : createJsonResponse({}, 200)
      );
    vi.stubGlobal("fetch", fetchMock);

    const runtime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey
      ),
      now: () => new Date("2026-07-31T09:45:00.000Z"),
    });

    await runtime.login({
      email: "user@example.com",
      password: "secret123",
    });
    expect(readStoredSession(storageKey)).not.toBeNull();

    await expect(runtime.logout()).resolves.toBeUndefined();
    expect(readStoredSession(storageKey)).toBeNull();

    const restoredRuntime = new EmailAuthRuntime({
      client: createSupabaseBrowserClient(
        "https://example.supabase.co",
        "anon-key",
        storageKey
      ),
      now: () => new Date("2026-07-31T09:50:00.000Z"),
    });

    await expect(restoredRuntime.getSession()).resolves.toMatchObject({
      status: "unauthenticated",
      user: null,
    });
  });
});
