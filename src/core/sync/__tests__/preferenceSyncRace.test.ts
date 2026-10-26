import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUPABASE_SYNC_METADATA_STORAGE_KEY } from "../supabaseSyncConfig";
import { SupabasePreferenceSyncProvider } from "../SupabasePreferenceSyncProvider";
import type { SupabaseRecordRow, SupabaseSession } from "../supabaseClient";
import type { AuthProvider, AuthSession } from "@/core/auth";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { taskRecord, settingRecord } from "@/test/factories";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { writeStoredPreference } from "@/shared/preferences/storage";
import { APPEARANCE_STORAGE_KEY, LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const now = new Date("2026-10-26T08:00:00Z");
const remoteTask = { ...taskRecord, id: "remote-task", title: "Remote task" };
const remoteRow: SupabaseRecordRow = {
  user_id: "owner-a", entity: "tasks", record_id: remoteTask.id,
  payload: { ...remoteTask }, updated_at: remoteTask.updatedAt, created_at: remoteTask.createdAt,
};
function harness(initialMetadata?: Record<string, unknown>) {
  let userId: string | null = "owner-a";
  let metadata: Record<string, unknown> = initialMetadata ?? { alios_preferences: { [APPEARANCE_STORAGE_KEY]: "dark" } };
  const authSession = (): AuthSession => ({
    status: userId ? "authenticated" : "unauthenticated", provider: "email",
    user: userId ? { userId, email: "fake@example.test", displayName: "Fake", createdAt: now.toISOString(), updatedAt: now.toISOString() } : null,
  });
  const session = (): SupabaseSession | null => userId ? { access_token: "fake", user: { id: userId, user_metadata: metadata } } : null;
  const listeners = new Set<(session: AuthSession) => void>();
  let maxListeners = 0;
  const authProvider: AuthProvider = {
    name: "email", getCurrentSession: async () => authSession(), getCurrentUser: async () => authSession().user,
    login: async () => ({ session: authSession() }), logout: async () => undefined,
    refreshSession: async () => authSession(), subscribe: (listener) => { listeners.add(listener); maxListeners = Math.max(maxListeners, listeners.size); return { unsubscribe: () => listeners.delete(listener) }; },
  };
  const entered = deferred<void>();
  const read = deferred<{ data: ReadonlyArray<SupabaseRecordRow>; error: Error | null }>();
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: session() }, error: null })),
      signInWithIdToken: vi.fn(async () => ({ data: { session: session() }, error: null })),
      updateUser: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        metadata = data; return { data: { user: session()?.user ?? null }, error: null };
      }),
      signOut: vi.fn(async () => ({ error: null })),
    },
    records: {
      list: vi.fn(async () => { entered.resolve(); return read.promise; }),
      upsert: vi.fn(async ({ rows }: { rows: ReadonlyArray<SupabaseRecordRow> }) => ({ data: rows, error: null })),
    },
  };
  return { authProvider, client, entered, read, listenerCount: () => listeners.size, maxListenerCount: () => maxListeners, switchAccount(next: string | null) { userId = next; metadata = {}; listeners.forEach((listener) => listener(authSession())); } };
}

describe("A0 preference sync stale snapshot regression", () => {
  let context: Awaited<ReturnType<typeof createTestStorage>>;
  const providers: SupabasePreferenceSyncProvider[] = [];
  beforeEach(async () => { localStorage.clear(); context = await createTestStorage(); });
  afterEach(async () => { providers.splice(0).forEach((provider) => provider.deactivate()); vi.restoreAllMocks(); vi.unstubAllGlobals(); await destroyTestDatabase(context.database); });
  const start = (h: ReturnType<typeof harness>, withOutbox = false) => {
    const provider = new SupabasePreferenceSyncProvider({ client: h.client, authProvider: h.authProvider,
      mutationOutboxRepository: withOutbox ? context.storage.mutationOutbox : undefined,
      backupStorage: context.storage.backup, getStorage: () => localStorage, now: () => now });
    providers.push(provider);
    return { provider, pending: provider.syncNow() };
  };

  it("preserves a setting and new Task created while initial remote hydration is pending", async () => {
    const h = harness(); const { pending } = start(h); await h.entered.promise;
    const setting = { ...settingRecord, id: "user-setting", key: "user-setting", value: "newer" };
    const task = { ...taskRecord, id: "local-new", title: "Typed while waiting" };
    await context.database.settings.put(setting);
    await context.database.tasks.put(task);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "light");
    h.read.resolve({ data: [remoteRow], error: null }); await pending;
    expect(await context.database.settings.get(setting.id)).toEqual(setting);
    expect(await context.database.tasks.get(task.id)).toEqual(task);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
    expect(h.client.auth.updateUser).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      alios_preferences: expect.objectContaining({ [APPEARANCE_STORAGE_KEY]: "light" }),
    }) }));
    expect(await context.database.tasks.get(remoteTask.id)).toBeDefined();
  });

  it("does not overwrite an updated Task or resurrect a deleted Task after a delayed read", async () => {
    const original = { ...taskRecord, id: "edited" };
    const deleted = { ...taskRecord, id: "deleted" };
    await context.database.tasks.bulkPut([original, deleted]);
    const h = harness(); const { pending } = start(h); await h.entered.promise;
    const updated = { ...original, title: "New local edit", updatedAt: now.toISOString() };
    await context.database.tasks.put(updated); await context.database.tasks.delete(deleted.id);
    h.read.resolve({ data: [remoteRow, { ...remoteRow, record_id: deleted.id, payload: { ...deleted } }], error: null });
    expect((await pending).status.mode).toBe("error");
    expect(h.client.records.upsert).not.toHaveBeenCalled();
    expect(await context.database.tasks.get(original.id)).toEqual(updated);
    expect(await context.database.tasks.get(deleted.id)).toBeUndefined();
  });

  it.each(["owner-b", null])("does not apply or upload owner A's pending snapshot after switching to %s", async (next) => {
    const h = harness(); const { pending } = start(h); await h.entered.promise;
    h.switchAccount(next); h.read.resolve({ data: [remoteRow], error: null }); await pending;
    expect(await context.database.tasks.get(remoteTask.id)).toBeUndefined();
    expect(h.client.records.upsert).not.toHaveBeenCalled();
    expect(h.client.auth.updateUser).not.toHaveBeenCalled();
  });

  it("keeps local preferences written while the initial session hydration is delayed", async () => {
    const h = harness(); const entered = deferred<void>();
    const sessionRead = deferred<Awaited<ReturnType<typeof h.client.auth.getSession>>>();
    const getSession = h.client.auth.getSession.getMockImplementation()!;
    h.client.auth.getSession.mockImplementationOnce(() => { entered.resolve(); return sessionRead.promise; });
    const { pending } = start(h); await entered.promise;
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "light");
    sessionRead.resolve(await getSession()); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await pending;
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
    expect(h.client.auth.updateUser.mock.calls.at(-1)?.[0].data.alios_preferences).toMatchObject({ [APPEARANCE_STORAGE_KEY]: "light" });
  });

  it("retains all local collections on read failure and recovers on reconnect/retry", async () => {
    const h = harness(); const { pending, provider } = start(h); await h.entered.promise;
    const setting = { ...settingRecord, id: "offline-setting", value: "offline" };
    await context.database.settings.put(setting);
    await context.database.tasks.put({ ...taskRecord, id: "offline-task" });
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "light");
    h.read.resolve({ data: [], error: new Error("Network offline") });
    expect((await pending).status.mode).toBe("error");
    expect(h.client.records.upsert).not.toHaveBeenCalled();
    expect(await context.database.settings.get(setting.id)).toEqual(setting);
    h.client.records.list.mockResolvedValue({ data: [remoteRow], error: null });
    expect((await provider.syncNow()).status.mode).toBe("ready");
    expect(await context.database.tasks.get("offline-task")).toMatchObject({ title: taskRecord.title });
    expect(await context.database.settings.get(setting.id)).toEqual(setting);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
  });

  it("does not infer deletion from an incomplete remote snapshot and is idempotent on repeat", async () => {
    const h = harness();
    const localTask = { ...taskRecord, id: "remote-omitted", sync: { ownerUserId: "owner-a", lastSyncedAt: now.toISOString() } };
    await context.database.tasks.put(localTask);
    const { pending, provider } = start(h); await h.entered.promise;
    h.read.resolve({ data: [remoteRow], error: null }); await pending;
    const first = await context.storage.backup.readAll();
    await provider.syncNow();
    expect(await context.storage.backup.readAll()).toEqual(first);
    expect(await context.database.tasks.count()).toBe(2);
    expect(await context.database.tasks.get(localTask.id)).toMatchObject({ title: localTask.title });
  });

  it("coalesces changes during an in-flight metadata upload into a follow-up with latest preferences", async () => {
    const events = new EventTarget();
    vi.stubGlobal("window", { localStorage, addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) });
    const h = harness(); const uploadEntered = deferred<void>(); const finishUpload = deferred<void>();
    const secondUpload = deferred<void>(); let first = true;
    const update = h.client.auth.updateUser.getMockImplementation()!;
    h.client.auth.updateUser.mockImplementation(async (input) => {
      if (first) { first = false; uploadEntered.resolve(); await finishUpload.promise; }
      else secondUpload.resolve();
      return update(input);
    });
    const { pending, provider } = start(h); provider.activate(); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await uploadEntered.promise;
    writeStoredPreference(APPEARANCE_STORAGE_KEY, "light", localStorage);
    writeStoredPreference(APPEARANCE_STORAGE_KEY, "system", localStorage);
    finishUpload.resolve(); await pending; await secondUpload.promise;
    await provider.syncNow(); // Join the queued run; never sleeps or polls a timer.
    expect(h.client.auth.updateUser).toHaveBeenCalledTimes(2);
    expect(h.client.auth.updateUser.mock.calls.at(-1)?.[0].data.alios_preferences).toMatchObject({ [APPEARANCE_STORAGE_KEY]: "system" });
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("system");
  });

  it("rejects a stale conflict-resolution snapshot without replacing unrelated collections", async () => {
    const h = harness(); const local = { ...taskRecord, id: "conflict" };
    await context.database.tasks.put(local);
    const { pending, provider } = start(h); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await pending;
    const remote = { ...local, title: "Remote conflict version" };
    h.client.records.list.mockResolvedValue({ data: [{ ...remoteRow, record_id: local.id, payload: { ...remote } }], error: null });
    const entered = deferred<void>(); const finish = deferred<void>();
    h.client.records.upsert.mockImplementationOnce(async ({ rows }) => { entered.resolve(); await finish.promise; return { data: rows, error: null }; });
    const resolving = provider.resolveConflict({ entity: "tasks", recordId: local.id, resolution: "keep-remote" });
    await entered.promise;
    const updated = { ...local, title: "Edit during conflict resolution", updatedAt: now.toISOString() };
    const setting = { ...settingRecord, id: "during-conflict", value: "keep" };
    await context.database.tasks.put(updated); await context.database.settings.put(setting);
    finish.resolve();
    await expect(resolving).rejects.toThrow("Local records changed during sync");
    expect(await context.database.tasks.get(local.id)).toEqual(updated);
    expect(await context.database.settings.get(setting.id)).toEqual(setting);
  });

  it("does not overwrite a reentrant local write triggered by another hydration event", async () => {
    const events = new EventTarget();
    vi.stubGlobal("window", { localStorage, addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) });
    events.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, () => {
      if (localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" && localStorage.getItem(APPEARANCE_STORAGE_KEY) === null) {
        writeStoredPreference(APPEARANCE_STORAGE_KEY, "light", localStorage);
      }
    });
    const h = harness({ alios_preferences: { [LANGUAGE_STORAGE_KEY]: "en", [APPEARANCE_STORAGE_KEY]: "dark" } });
    const { pending } = start(h); await h.entered.promise; h.read.resolve({ data: [], error: null }); await pending;
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
  });

  it("uploads the latest local preference rather than the pre-hydration snapshot", async () => {
    const h = harness(); const { pending } = start(h); await h.entered.promise;
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "light");
    h.read.resolve({ data: [], error: null }); await pending;
    expect(h.client.auth.updateUser.mock.calls.at(-1)?.[0].data.alios_preferences).toMatchObject({ [APPEARANCE_STORAGE_KEY]: "light" });
  });

  it("cancels the active account's pending hydration and uses fresh reads for the next account", async () => {
    const h = harness(); const { pending, provider } = start(h); provider.activate(); await h.entered.promise;
    h.client.records.list.mockResolvedValue({ data: [], error: null });
    h.switchAccount("owner-b"); h.read.resolve({ data: [remoteRow], error: null });
    await pending; const result = await provider.syncNow();
    expect(result.status.connectedUserId).toBe("owner-b");
    expect(await context.database.tasks.get(remoteTask.id)).toBeUndefined();
    expect(h.client.records.list).toHaveBeenLastCalledWith(expect.objectContaining({ userId: "owner-b" }));
    expect(h.client.records.upsert.mock.calls.every(([input]) => input.rows.every((row) => row.user_id === "owner-b"))).toBe(true);
  });

  it("does not resume an active hydration after logout and keeps sync opt-in disabled", async () => {
    const h = harness(); const { pending, provider } = start(h); provider.activate(); await h.entered.promise;
    h.switchAccount(null); h.read.resolve({ data: [remoteRow], error: null }); await pending;
    expect(localStorage.getItem("alios.sync.enabled")).toBeNull();
    expect(await context.database.tasks.get(remoteTask.id)).toBeUndefined();
    expect(h.client.records.upsert).not.toHaveBeenCalled();
    expect(h.client.auth.updateUser).not.toHaveBeenCalled();
  });

  it.each(["owner-b", null])("fences an inactive explicit sync if ownership changes after the final check but before the transaction: %s", async (next) => {
    const h = harness(); const entered = deferred<void>(); const release = deferred<void>();
    const apply = context.storage.backup.applySyncChanges.bind(context.storage.backup);
    vi.spyOn(context.storage.backup, "applySyncChanges").mockImplementationOnce(async (...args) => {
      entered.resolve(); await release.promise; return apply(...args);
    });
    const { pending } = start(h); await h.entered.promise;
    h.read.resolve({ data: [remoteRow], error: null }); await entered.promise;
    h.switchAccount(next); release.resolve(); await pending;
    expect(await context.database.tasks.get(remoteTask.id)).toBeUndefined();
    expect(h.client.records.upsert).not.toHaveBeenCalled();
    expect(h.client.auth.updateUser).not.toHaveBeenCalled();
  });

  it.each(["owner-b", null])("fences inactive conflict resolution across the final ownership check: %s", async (next) => {
    const h = harness(); const local = { ...taskRecord, id: "conflict-gap" };
    await context.database.tasks.put(local);
    const { pending, provider } = start(h); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await pending;
    const original = await context.database.tasks.get(local.id);
    h.client.records.list.mockResolvedValue({ data: [{ ...remoteRow, record_id: local.id, payload: { ...local, title: "Remote choice" } }], error: null });
    const entered = deferred<void>(); const release = deferred<void>();
    const apply = context.storage.backup.applySyncChanges.bind(context.storage.backup);
    vi.spyOn(context.storage.backup, "applySyncChanges").mockImplementationOnce(async (...args) => {
      entered.resolve(); await release.promise; return apply(...args);
    });
    const resolving = provider.resolveConflict({ entity: "tasks", recordId: local.id, resolution: "keep-remote" });
    await entered.promise; h.switchAccount(next); release.resolve();
    await expect(resolving).rejects.toThrow("sync session changed");
    expect(await context.database.tasks.get(local.id)).toEqual(original);
    expect(h.listenerCount()).toBe(0);
  });

  it("invalidates an A-to-B-to-A round trip and releases the temporary session watcher", async () => {
    const h = harness(); const entered = deferred<void>(); const release = deferred<void>();
    const apply = context.storage.backup.applySyncChanges.bind(context.storage.backup);
    vi.spyOn(context.storage.backup, "applySyncChanges").mockImplementationOnce(async (...args) => {
      entered.resolve(); await release.promise; return apply(...args);
    });
    const { pending } = start(h); await h.entered.promise;
    h.read.resolve({ data: [remoteRow], error: null }); await entered.promise;
    h.switchAccount("owner-b"); h.switchAccount("owner-a"); release.resolve(); await pending;
    expect(await context.database.tasks.get(remoteTask.id)).toBeUndefined();
    expect(h.listenerCount()).toBe(0);
    expect(h.maxListenerCount()).toBe(1);
  });

  it("keeps one shared session watcher across explicit sync, activation and deactivation", async () => {
    const h = harness(); const { pending, provider } = start(h); await h.entered.promise;
    expect(h.listenerCount()).toBe(1); provider.activate(); expect(h.listenerCount()).toBe(1);
    provider.deactivate(); expect(h.listenerCount()).toBe(1);
    h.read.resolve({ data: [remoteRow], error: null }); await pending;
    expect(h.listenerCount()).toBe(0); expect(h.maxListenerCount()).toBe(1);
    expect(await context.database.tasks.get(remoteTask.id)).toBeUndefined();
  });

  it("keeps an edit made during a previously accepted upload and reconciles it on retry", async () => {
    const h = harness(); const local = { ...taskRecord, id: "in-flight-edit" };
    await context.database.tasks.put(local);
    const entered = deferred<void>(); const release = deferred<void>();
    let accepted: ReadonlyArray<SupabaseRecordRow> = [];
    h.client.records.upsert.mockImplementationOnce(async ({ rows }) => {
      accepted = structuredClone(rows); entered.resolve(); await release.promise; return { data: rows, error: null };
    });
    const { pending, provider } = start(h); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await entered.promise;
    const edited = { ...(await context.database.tasks.get(local.id))!, title: "Latest in-flight edit", updatedAt: "2026-10-26T08:00:01.000Z" };
    await context.database.tasks.put(edited); release.resolve(); await pending;
    expect(await context.database.tasks.get(local.id)).toEqual(edited);
    expect(accepted[0]?.payload.title).toBe(local.title);
    h.client.records.list.mockResolvedValue({ data: accepted, error: null });
    await provider.syncNow();
    expect(h.client.records.upsert.mock.calls.at(-1)?.[0].rows[0]?.payload.title).toBe(edited.title);
    expect(await context.database.tasks.count()).toBe(1);
  });

  it("does not permanently block an outbox entry cancelled by a session change and retries after reconnect", async () => {
    const h = harness(); await context.database.tasks.put(taskRecord);
    const repository = context.storage.mutationOutbox!;
    const entry = await repository.enqueue({ entity: "tasks", recordId: taskRecord.id, operation: "update", payload: { ...taskRecord } });
    const entered = deferred<void>(); const release = deferred<void>();
    const claim = repository.claim.bind(repository);
    vi.spyOn(repository, "claim").mockImplementationOnce(async (...args) => {
      const claimed = await claim(...args); entered.resolve(); await release.promise; return claimed;
    });
    const { pending, provider } = start(h, true); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await entered.promise;
    h.switchAccount(null); release.resolve(); await pending;
    expect((await repository.getById(entry.id))?.status).toBe("retry-wait");
    expect(h.client.records.upsert).not.toHaveBeenCalled();
    h.switchAccount("owner-a");
    await context.database.mutationOutbox.update(entry.id, { nextAttemptAt: "2026-10-26T07:59:59.000Z" });
    h.client.records.list.mockResolvedValue({ data: [], error: null });
    await provider.syncNow();
    expect((await repository.getById(entry.id))?.status).toBe("acknowledged");
    expect(await context.database.tasks.get(taskRecord.id)).toMatchObject({ title: taskRecord.title });
  });

  it("does not overwrite the next account's sync metadata after a delayed initial session result", async () => {
    const h = harness(); const entered = deferred<void>();
    const release = deferred<Awaited<ReturnType<typeof h.client.auth.getSession>>>();
    const original = h.client.auth.getSession.getMockImplementation()!;
    h.client.auth.getSession.mockImplementationOnce(async () => {
      const result = await original(); entered.resolve(); return release.promise.then(() => result);
    });
    const { pending } = start(h); await entered.promise; h.switchAccount("owner-b");
    const metadata = { backendUserId: "owner-b", lastOutcome: "success", detail: "B owns this status" };
    localStorage.setItem(SUPABASE_SYNC_METADATA_STORAGE_KEY, JSON.stringify(metadata));
    release.resolve(await original()); await pending;
    expect(JSON.parse(localStorage.getItem(SUPABASE_SYNC_METADATA_STORAGE_KEY)!)).toEqual(metadata);
  });

  it("does not publish the old account's conflict completion after the local commit and an account transition", async () => {
    const h = harness(); const local = { ...taskRecord, id: "conflict-completion" };
    await context.database.tasks.put(local);
    const { pending, provider } = start(h); await h.entered.promise;
    h.read.resolve({ data: [], error: null }); await pending;
    h.client.records.list.mockResolvedValue({ data: [{ ...remoteRow, record_id: local.id, payload: { ...local, title: "Remote choice" } }], error: null });
    const apply = context.storage.backup.applySyncChanges.bind(context.storage.backup);
    const metadata = { backendUserId: "owner-b", lastOutcome: "success", detail: "B owns completion" };
    vi.spyOn(context.storage.backup, "applySyncChanges").mockImplementationOnce(async (...args) => {
      await apply(...args); h.switchAccount("owner-b");
      h.client.records.list.mockResolvedValue({ data: [], error: null });
      localStorage.setItem(SUPABASE_SYNC_METADATA_STORAGE_KEY, JSON.stringify(metadata));
    });
    const resolving = provider.resolveConflict({ entity: "tasks", recordId: local.id, resolution: "keep-remote" });
    await expect(resolving).rejects.toThrow("sync session changed");
    expect(JSON.parse(localStorage.getItem(SUPABASE_SYNC_METADATA_STORAGE_KEY)!)).toEqual(metadata);
  });
});
