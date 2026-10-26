import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import { AliosDatabase } from "@/db/dexie";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { taskRecord, inboxItemRecord, settingRecord } from "@/test/factories";

describe("atomic sync record changes", () => {
  let context: Awaited<ReturnType<typeof createTestStorage>>;
  let peer: AliosDatabase;
  beforeEach(async () => {
    context = await createTestStorage(); peer = new AliosDatabase(); await peer.open();
  });
  afterEach(async () => { peer.close(); await destroyTestDatabase(context.database); });

  it("retains a different record added through another connection and never changes settings", async () => {
    const before = await context.storage.backup.readAll();
    const after = structuredClone(before); after.tasks.push(taskRecord);
    await peer.tasks.put({ ...taskRecord, id: "new-in-peer" });
    await peer.settings.put(settingRecord);
    await context.storage.backup.applySyncChanges(before, after);
    expect(await peer.tasks.count()).toBe(2);
    expect(await peer.settings.get(settingRecord.id)).toEqual(settingRecord);
  });

  it("rolls back earlier entity writes when a later target was edited by another connection", async () => {
    await context.database.inboxItems.put(inboxItemRecord); await context.database.tasks.put(taskRecord);
    const before = await context.storage.backup.readAll(); const after = structuredClone(before);
    after.inboxItems[0].content = "Remote inbox"; after.tasks[0].title = "Remote task";
    const edited = { ...taskRecord, title: "New peer edit" }; await peer.tasks.put(edited);
    await expect(context.storage.backup.applySyncChanges(before, after)).rejects.toThrow("Local records changed during sync");
    expect(await peer.inboxItems.get(inboxItemRecord.id)).toEqual(inboxItemRecord);
    expect(await peer.tasks.get(taskRecord.id)).toEqual(edited);
  });

  it("does not resurrect a concurrently deleted record or delete a concurrently edited record", async () => {
    await context.database.tasks.put(taskRecord);
    const before = await context.storage.backup.readAll(); const after = structuredClone(before);
    after.tasks[0].title = "Old pending update"; await peer.tasks.delete(taskRecord.id);
    await expect(context.storage.backup.applySyncChanges(before, after)).rejects.toThrow("Local records changed during sync");
    expect(await peer.tasks.get(taskRecord.id)).toBeUndefined();
    await peer.tasks.put(taskRecord);
    const deleting = structuredClone(before); deleting.tasks = [];
    const edited = { ...taskRecord, title: "Keep newer edit" }; await peer.tasks.put(edited);
    await expect(context.storage.backup.applySyncChanges(before, deleting)).rejects.toThrow("Local records changed during sync");
    expect(await peer.tasks.get(taskRecord.id)).toEqual(edited);
  });

  it("rolls back if the session is invalidated during an IndexedDB write", async () => {
    const before = await context.storage.backup.readAll(); const after = structuredClone(before);
    after.tasks.push(taskRecord); let current = true;
    context.database.tasks.hook("creating", () => { current = false; });
    await expect(context.storage.backup.applySyncChanges(before, after, () => current)).rejects.toThrow("sync session changed");
    expect(await peer.tasks.count()).toBe(0);
  });

  it("applies a confirmed deletion, leaves the outbox untouched and rejects a stale replay", async () => {
    await context.database.tasks.put(taskRecord);
    const before = await context.storage.backup.readAll(); const after = structuredClone(before); after.tasks = [];
    await context.storage.mutationOutbox?.enqueue({ entity: "tasks", recordId: "pending", operation: "update", payload: { ...taskRecord } });
    await context.storage.mutationOutbox?.enqueue({ entity: "tasks", recordId: "tombstone", operation: "delete", payload: { ...taskRecord }, deletedAt: "2026-10-26T08:00:00.000Z" });
    const queued = await context.database.mutationOutbox.toArray();
    expect(queued).toHaveLength(2);
    await context.storage.backup.applySyncChanges(before, after);
    expect(await context.database.tasks.count()).toBe(0);
    expect(await context.database.mutationOutbox.toArray()).toEqual(queued);
    await expect(context.storage.backup.applySyncChanges(before, after)).rejects.toThrow("Local records changed during sync");
  });

  it("rolls back IndexedDB write errors and permits a later fresh retry", async () => {
    const before = await context.storage.backup.readAll(); const after = structuredClone(before);
    after.inboxItems.push(inboxItemRecord); after.tasks.push(taskRecord);
    const fail = () => { throw new DOMException("Synthetic storage failure", "QuotaExceededError"); };
    context.database.tasks.hook("creating", fail);
    await expect(context.storage.backup.applySyncChanges(before, after)).rejects.toThrow("Synthetic storage failure");
    expect(await peer.inboxItems.count()).toBe(0); expect(await peer.tasks.count()).toBe(0);
    context.database.tasks.hook("creating").unsubscribe(fail);
    await context.storage.backup.applySyncChanges(await context.storage.backup.readAll(), after);
    expect(await peer.inboxItems.count()).toBe(1); expect(await peer.tasks.count()).toBe(1);
  });

  it("rolls back explicit transaction aborts and does not poison subsequent transactions", async () => {
    const before = await context.storage.backup.readAll(); const after = structuredClone(before);
    after.inboxItems.push(inboxItemRecord); after.tasks.push(taskRecord);
    const abort = () => { Dexie.currentTransaction?.abort(); };
    context.database.tasks.hook("creating", abort);
    await expect(context.storage.backup.applySyncChanges(before, after)).rejects.toThrow();
    expect(await peer.inboxItems.count()).toBe(0); expect(await peer.tasks.count()).toBe(0);
    context.database.tasks.hook("creating").unsubscribe(abort);
    await context.storage.backup.applySyncChanges(await context.storage.backup.readAll(), after);
    expect(await peer.tasks.count()).toBe(1);
  });

  it("recovers from stale CAS using a fresh baseline once local writes stop", async () => {
    await context.database.tasks.put(taskRecord);
    const before = await context.storage.backup.readAll(); const after = structuredClone(before);
    after.tasks[0].title = "Remote proposal";
    await peer.tasks.put({ ...taskRecord, title: "Latest local" });
    await expect(context.storage.backup.applySyncChanges(before, after)).rejects.toThrow("Local records changed during sync");
    const fresh = await context.storage.backup.readAll(); const retry = structuredClone(fresh);
    retry.tasks[0].sync = { ownerUserId: "owner-a", lastSyncedAt: "2026-10-26T08:00:00.000Z" };
    await context.storage.backup.applySyncChanges(fresh, retry);
    expect(await peer.tasks.get(taskRecord.id)).toMatchObject({ title: "Latest local", sync: { ownerUserId: "owner-a" } });
  });
});
