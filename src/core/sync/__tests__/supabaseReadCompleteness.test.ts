import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProvider, AuthSession } from "@/core/auth";
import { APPEARANCE_STORAGE_KEY } from "@/shared/constants/preferences";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { settingRecord, taskRecord } from "@/test/factories";
import { SupabasePreferenceSyncProvider } from "../SupabasePreferenceSyncProvider";
import {
  createSupabaseBrowserClient, createSupabaseRecordTombstonePayload,
  type SupabaseRecordRow, type SupabaseSession,
} from "../supabaseClient";

const storageKey = "a4.synthetic.auth";
const owner = "owner-a";
const table = "alios_sync_records";
const now = new Date("2026-10-26T08:00:00.000Z");
const session: SupabaseSession = {
  access_token: "synthetic-access-token", user: {
    id: owner, user_metadata: { alios_preferences: { [APPEARANCE_STORAGE_KEY]: "dark" } },
  },
};
const request = { table, userId: owner, entities: ["tasks"] };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function row(id: string, entity = "tasks"): SupabaseRecordRow {
  return {
    user_id: owner, entity, record_id: id,
    payload: { ...taskRecord, id, title: "Remote " + id },
    created_at: taskRecord.createdAt, updated_at: taskRecord.updatedAt,
    has_conflict: false,
  };
}
function pageResponse(body: unknown, range: string | null, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: range === null ? {} : { "content-range": range },
  });
}
function cappedPage(rows: ReadonlyArray<SupabaseRecordRow>, url: URL, cap: number) {
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? cap), cap);
  const page = rows.slice(offset, offset + limit);
  return pageResponse(page, page.length ? offset + "-" + (offset + page.length - 1) + "/" + rows.length : "*/" + rows.length,
    offset + page.length < rows.length ? 206 : 200);
}
function browserClient() {
  return createSupabaseBrowserClient("https://sync.example.test", "synthetic-public-key", storageKey);
}
function installServer(
  rows: ReadonlyArray<SupabaseRecordRow>, cap = 500,
  override?: (url: URL) => Response | Promise<Response> | undefined
) {
  const getUrls: URL[] = [];
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname !== "sync.example.test" || !url.pathname.endsWith("/" + table)) {
      throw new Error("Unexpected synthetic request");
    }
    if (options?.method === "POST") return pageResponse(JSON.parse(String(options.body)), null);
    getUrls.push(url);
    return override?.(url) ?? cappedPage(rows, url, cap);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getUrls };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(storageKey, JSON.stringify(session));
  const events = new EventTarget();
  vi.stubGlobal("window", { localStorage, addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unmocked fetch is forbidden"); }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Supabase adapter complete remote reads", () => {
  it.each([0, 3, 500, 501, 1001])("returns every row for a stable %s-row result, including exact page boundaries", async (count) => {
    const rows = Array.from({ length: count }, (_, index) => row(String(index).padStart(4, "0")));
    const server = installServer(rows);
    const result = await browserClient().records.list(request);
    expect(result.error).toBeNull(); expect(result.data).toEqual(rows);
    expect(server.getUrls.map((url) => Number(url.searchParams.get("offset")))).toEqual(
      count === 0 ? [0] : Array.from({ length: Math.ceil(count / 500) }, (_, index) => index * 500)
    );
  });

  it("reads all pages when the server caps each page below the requested size", async () => {
    const rows = [row("a"), row("b"), row("z")]; const server = installServer(rows, 1);
    const result = await browserClient().records.list(request);
    expect(result.error).toBeNull(); expect(result.data).toEqual(rows);
    expect(server.getUrls.map((url) => url.searchParams.get("offset"))).toEqual(["0", "1", "2"]);
  });

  it.each(["http", "transport", "json"])("returns no partial rows when a later page fails: %s", async (failure) => {
    installServer([row("a"), row("b")], 1, (url) => {
      if (url.searchParams.get("offset") !== "1") return undefined;
      if (failure === "transport") return Promise.reject(new Error("Synthetic network failure"));
      if (failure === "json") return new Response("{", { headers: { "content-range": "1-1/2" } });
      return pageResponse({ message: "Synthetic page failure" }, null, 503);
    });
    const result = await browserClient().records.list(request);
    expect(result.error).toBeInstanceOf(Error); expect(result.data).toEqual([]);
  });

  it("rejects overlapping identities instead of hiding the overlap by deduplication", async () => {
    installServer([row("a"), row("b")], 1, (url) => url.searchParams.get("offset") === "1"
      ? pageResponse([row("a")], "1-1/2") : undefined);
    const result = await browserClient().records.list(request);
    expect(result.error).toBeInstanceOf(Error); expect(result.data).toEqual([]);
  });

  it.each([
    { name: "missing total", body: [row("b")], range: "1-1/*" },
    { name: "missing range", body: [row("b")], range: null },
    { name: "changed total", body: [row("b")], range: "1-1/3" },
    { name: "ignored offset", body: [row("b")], range: "0-0/2" },
    { name: "premature empty page", body: [], range: "*/2" },
    { name: "wrong body length", body: [row("b")], range: "1-2/2" },
    { name: "non-array body", body: { message: "not a list" }, range: "1-1/2" },
  ])("fails closed for $name", async ({ body, range }) => {
    installServer([row("a"), row("b")], 1, (url) => url.searchParams.get("offset") === "1"
      ? pageResponse(body, range) : undefined);
    const result = await browserClient().records.list(request);
    expect(result.error).toBeInstanceOf(Error); expect(result.data).toEqual([]);
  });

  it.each([
    { name: "non-array first body", body: { message: "not rows" }, range: "*/0" },
    { name: "contradictory empty range", body: [], range: "0-0/0" },
  ])("rejects a malformed successful first response rather than interpreting it as empty: $name", async ({ body, range }) => {
    installServer([], 1, () => pageResponse(body, range));
    const result = await browserClient().records.list(request);
    expect(result.error).toBeInstanceOf(Error); expect(result.data).toEqual([]);
  });

  it("preserves user/entity filters, tombstones and composite identity on every page", async () => {
    const live = row("same-id", "routines");
    const deleted = { ...row("same-id"), payload: { ...createSupabaseRecordTombstonePayload(now.toISOString(), { ...taskRecord, id: "same-id" }) } };
    const rows = [live, deleted]; const server = installServer(rows, 1);
    const result = await browserClient().records.list({ ...request, entities: ["routines", "tasks"] });
    expect(result.error).toBeNull(); expect(result.data).toEqual(rows);
    expect(result.data[1]?.payload).toEqual(deleted.payload);
    for (const [input, options] of server.fetchMock.mock.calls) {
      const url = new URL(String(input));
      expect(url.searchParams.get("user_id")).toBe("eq." + owner);
      expect(url.searchParams.get("entity")).toBe('in.("routines","tasks")');
      expect(url.searchParams.get("order")).toBe("entity.asc,record_id.asc");
      expect(url.searchParams.get("limit")).toBe("500");
      expect(new Headers(options?.headers).get("prefer")).toBe("count=exact");
      expect(new Headers(options?.headers).get("authorization")).toBe("Bearer " + session.access_token);
    }
  });

  it("accepts the SQL nullable metadata without changing the tombstone payload", async () => {
    const value = { ...row("a"), last_synced_at: null, last_synced_by_device_id: null, conflict_reason: null };
    installServer([], 1, () => pageResponse([value], "0-0/1"));
    const result = await browserClient().records.list(request);
    expect(result.error).toBeNull(); expect(result.data[0]?.payload).toEqual(value.payload);
    expect(result.data[0]?.last_synced_at).toBeUndefined();
  });

  it.each([
    { user_id: "another-user" }, { entity: "journalEntries" },
    { record_id: "mismatched-id" }, { payload: null },
  ])("rejects out-of-scope or invalid rows: %j", async (override) => {
    installServer([], 1, () => pageResponse([{ ...row("a"), ...override }], "0-0/1"));
    const result = await browserClient().records.list(request);
    expect(result.error).toBeInstanceOf(Error); expect(result.data).toEqual([]);
  });

  it.each(["switch", "logout"])("discards every page when the session changes during listing: %s", async (change) => {
    installServer([row("a"), row("b")], 1, (url) => {
      if (url.searchParams.get("offset") !== "1") return undefined;
      if (change === "logout") localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify({ ...session, user: { id: "owner-b" } }));
      return pageResponse([row("b")], "1-1/2");
    });
    const result = await browserClient().records.list(request);
    expect(result.error).toBeInstanceOf(Error); expect(result.data).toEqual([]);
  });

  it("returns an empty requested scope without a request", async () => {
    const server = installServer([]);
    expect(await browserClient().records.list({ ...request, entities: [] })).toEqual({ data: [], error: null });
    expect(server.fetchMock).not.toHaveBeenCalled();
  });
});

describe("complete reads at normal Sync and conflict boundaries", () => {
  let context: Awaited<ReturnType<typeof createTestStorage>>;
  const providers: SupabasePreferenceSyncProvider[] = [];
  beforeEach(async () => { context = await createTestStorage(); localStorage.setItem("alios.sync.enabled", "true"); });
  afterEach(async () => { providers.splice(0).forEach((provider) => provider.deactivate()); await destroyTestDatabase(context.database); });
  const local = { ...taskRecord, id: "z", title: "Older local value", sync: { ownerUserId: owner, lastSyncedAt: "2026-10-25T08:00:00.000Z" } };
  const newest = { ...local, title: "Newer remote value", updatedAt: "2026-10-26T07:00:00.000Z",
    sync: { ownerUserId: owner, lastSyncedAt: "2026-10-26T07:30:00.000Z" } };
  const remoteRows = [row("a"), row("b"), { ...row("z"), payload: { ...newest }, updated_at: newest.updatedAt }];

  function providerHarness() {
    let currentOwner: string | null = owner;
    const listeners = new Set<(session: AuthSession) => void>();
    const current = (): AuthSession => ({ status: currentOwner ? "authenticated" : "unauthenticated", provider: "email",
      user: currentOwner ? { userId: currentOwner, email: "fake@example.test", displayName: "Fake", createdAt: now.toISOString(), updatedAt: now.toISOString() } : null });
    const auth: AuthProvider = {
      name: "email", getCurrentSession: async () => current(), getCurrentUser: async () => current().user,
      login: async () => ({ session: current() }), logout: async () => undefined, refreshSession: async () => current(),
      subscribe: (listener) => { listeners.add(listener); return { unsubscribe: () => listeners.delete(listener) }; },
    };
    const client = browserClient();
    const updateUser = vi.spyOn(client.auth, "updateUser").mockResolvedValue({ data: { user: session.user }, error: null });
    const upsert = vi.spyOn(client.records, "upsert");
    const apply = vi.spyOn(context.storage.backup, "applySyncChanges");
    const claim = vi.spyOn(context.storage.mutationOutbox!, "claim");
    const provider = new SupabasePreferenceSyncProvider({ client, authProvider: auth,
      backupStorage: context.storage.backup, mutationOutboxRepository: context.storage.mutationOutbox,
      getStorage: () => localStorage, now: () => now });
    providers.push(provider);
    return { provider, updateUser, upsert, apply, claim, switchAccount(next: string | null) {
      currentOwner = next;
      if (next) localStorage.setItem(storageKey, JSON.stringify({ ...session, user: { id: next } }));
      else localStorage.removeItem(storageKey);
      listeners.forEach((listener) => listener(current()));
    } };
  }

  it("does not overwrite a newer remote record merely because it is on a later page", async () => {
    await context.database.tasks.put(local); const server = installServer(remoteRows, 2); const h = providerHarness();
    const result = await h.provider.syncNow();
    expect(result.status.mode).toBe("ready");
    expect(await context.database.tasks.get(local.id)).toMatchObject({ title: newest.title });
    expect(server.getUrls.map((url) => url.searchParams.get("offset"))).toEqual(["0", "2"]);
    expect(h.upsert.mock.calls.flatMap(([input]) => input.rows).some((value) => value.record_id === local.id && value.payload.title === local.title)).toBe(false);
  });

  it("refuses reconciliation, preferences, outbox claims and uploads after an incomplete read, then retries safely", async () => {
    await context.database.tasks.put(local);
    const entry = await context.storage.mutationOutbox!.enqueue({ entity: "tasks", recordId: "unrelated-deletion", operation: "delete", payload: { ...taskRecord, id: "unrelated-deletion" } });
    const before = await context.storage.backup.readAll(); const h = providerHarness();
    installServer(remoteRows, 2, (url) => url.searchParams.get("offset") === "2" ? pageResponse({ message: "Synthetic page failure" }, null, 503) : undefined);
    expect((await h.provider.syncNow()).status.mode).toBe("error");
    expect(await context.storage.backup.readAll()).toEqual(before);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
    expect(h.apply).not.toHaveBeenCalled(); expect(h.upsert).not.toHaveBeenCalled();
    expect(h.updateUser).not.toHaveBeenCalled(); expect(h.claim).not.toHaveBeenCalled();
    expect((await context.storage.mutationOutbox!.getById(entry.id))?.status).toBe("pending");
    installServer(remoteRows, 2);
    expect((await h.provider.syncNow()).status.mode).toBe("ready");
    expect(await context.database.tasks.get(local.id)).toMatchObject({ title: newest.title });
  });

  it("waits for every page before hydration and retains edits made while a later page is pending", async () => {
    await context.database.tasks.put(local); const h = providerHarness();
    const entered = deferred<void>(); const release = deferred<Response>();
    installServer(remoteRows, 2, (url) => {
      if (url.searchParams.get("offset") !== "2") return undefined;
      entered.resolve(); return release.promise;
    });
    const pending = h.provider.syncNow(); await entered.promise;
    expect(h.apply).not.toHaveBeenCalled(); expect(h.upsert).not.toHaveBeenCalled();
    expect(h.claim).not.toHaveBeenCalled(); expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
    expect(await context.database.tasks.count()).toBe(1);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "light");
    await context.database.settings.put({ ...settingRecord, id: "while-paging", value: "keep" });
    release.resolve(pageResponse(remoteRows.slice(2), "2-2/3")); await pending;
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
    expect(await context.database.settings.get("while-paging")).toMatchObject({ value: "keep" });
  });

  it.each(["owner-b", null])("does not apply pending pages after an account transition: %s", async (next) => {
    await context.database.tasks.put(local); const before = await context.storage.backup.readAll();
    const h = providerHarness(); const entered = deferred<void>(); const release = deferred<Response>();
    installServer(remoteRows, 2, (url) => {
      if (url.searchParams.get("offset") !== "2") return undefined;
      entered.resolve(); return release.promise;
    });
    const pending = h.provider.syncNow(); await entered.promise;
    h.switchAccount(next); release.resolve(pageResponse(remoteRows.slice(2), "2-2/3")); await pending;
    expect(await context.storage.backup.readAll()).toEqual(before);
    expect(h.apply).not.toHaveBeenCalled(); expect(h.upsert).not.toHaveBeenCalled();
    expect(h.updateUser).not.toHaveBeenCalled(); expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
  });

  it.each(["list", "resolve"])("refuses conflict %s from incomplete pages without local or remote mutations", async (action) => {
    // The selected conflict is on page one: the legacy adapter would resolve it
    // without discovering that the required later page failed.
    const selected = { ...local, id: "a", sync: { ...local.sync, conflictAt: now.toISOString() } };
    await context.database.tasks.put(selected);
    const before = await context.storage.backup.readAll(); const h = providerHarness();
    installServer(remoteRows, 2, (url) => url.searchParams.get("offset") === "2" ? pageResponse({}, null, 503) : undefined);
    const operation = action === "list" ? h.provider.listConflicts() : h.provider.resolveConflict({ entity: "tasks", recordId: selected.id, resolution: "keep-remote" });
    await expect(operation).rejects.toBeInstanceOf(Error);
    expect(await context.storage.backup.readAll()).toEqual(before);
    expect(h.apply).not.toHaveBeenCalled(); expect(h.upsert).not.toHaveBeenCalled(); expect(h.updateUser).not.toHaveBeenCalled();
  });

  it("uses complete reads for a conflict on a later page and for its resolution", async () => {
    await context.database.tasks.put({ ...local, sync: { ...local.sync, conflictAt: now.toISOString() } });
    const h = providerHarness(); const server = installServer(remoteRows, 2);
    expect((await h.provider.listConflicts()).map((conflict) => conflict.recordId)).toEqual([local.id]);
    await h.provider.resolveConflict({ entity: "tasks", recordId: local.id, resolution: "keep-remote" });
    expect(await context.database.tasks.get(local.id)).toMatchObject({ title: newest.title });
    expect(server.getUrls.some((url) => url.searchParams.get("offset") === "2")).toBe(true);
  });
});
