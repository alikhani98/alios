import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ValidationError } from "@/core/errors";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  dailyCheckinInput,
  financeObligationInput,
  financeTransactionInput,
  journalEntryInput,
  inboxItemInput,
  knowledgeItemInput,
  projectInput,
  settingInput,
  taskInput,
} from "@/test/factories";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { BackupService, createBackupFilename } from "../BackupService";

describe("BackupService with DexieBackupStorage", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  let service: BackupService;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    service = new BackupService(storage.backup);
    localStorage.clear();
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
    localStorage.clear();
  });

  it("exports, clears, and restores every supported data table", async () => {
    const project = await storage.projects.create(projectInput);
    const task = await storage.tasks.create(taskInput);
    const financeTransaction = await storage.finance.createTransaction(
      financeTransactionInput
    );
    const financeObligation = await storage.finance.createObligation(
      financeObligationInput
    );
    const journalEntry = await storage.journal.create(journalEntryInput);
    const knowledgeItem = await storage.knowledge.create(knowledgeItemInput);
    const dailyCheckin = await storage.dailyCheckins.create(dailyCheckinInput);
    const setting = await storage.settings.create(settingInput);
    const inboxItem = await storage.inbox.create(inboxItemInput);

    const backup = await service.createBackup();

    expect(backup.app).toBe("AliOS");
    expect(backup.backupVersion).toBe(1);
    expect(new Date(backup.exportedAt).toISOString()).toBe(backup.exportedAt);
    expect(Object.keys(backup.data).sort()).toEqual(
      [
        "dailyCheckins",
        "tasks",
        "financeTransactions",
        "financeObligations",
        "projects",
        "journalEntries",
        "knowledgeItems",
        "settings",
        "inboxItems",
      ].sort()
    );
    expect(backup.data.projects).toEqual([project]);
    expect(backup.data.tasks).toEqual([task]);
    expect(backup.data.financeTransactions).toEqual([financeTransaction]);
    expect(backup.data.financeObligations).toEqual([financeObligation]);
    expect(backup.data.journalEntries).toEqual([journalEntry]);
    expect(backup.data.knowledgeItems).toEqual([knowledgeItem]);
    expect(backup.data.dailyCheckins).toEqual([dailyCheckin]);
    expect(backup.data.settings).toEqual([setting]);
    expect(backup.data.inboxItems).toEqual([inboxItem]);
    expect(
      createBackupFilename(new Date("2026-07-05T08:30:00.000Z"))
    ).toBe(
      "alios-backup-2026-07-05-08-30.json"
    );

    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    await storage.backup.clearAll();

    expect(await storage.backup.getSummary()).toEqual({
      dailyCheckins: 0,
      tasks: 0,
      financeTransactions: 0,
      financeObligations: 0,
      projects: 0,
      journalEntries: 0,
      knowledgeItems: 0,
      settings: 0,
      inboxItems: 0,
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");

    await service.restoreBackup(backup);

    expect(await storage.projects.getById(project.id)).toEqual(project);
    expect(await storage.tasks.getById(task.id)).toEqual(task);
    expect(await storage.finance.getTransactionById(financeTransaction.id)).toEqual(
      financeTransaction
    );
    expect(await storage.finance.getObligationById(financeObligation.id)).toEqual(
      financeObligation
    );
    expect(await storage.journal.getById(journalEntry.id)).toEqual(journalEntry);
    expect(await storage.knowledge.getById(knowledgeItem.id)).toEqual(
      knowledgeItem
    );
    expect(await storage.dailyCheckins.getByDate(dailyCheckin.date)).toEqual(
      dailyCheckin
    );
    expect(await storage.settings.getByKey(setting.key)).toEqual(setting);
    expect(await storage.inbox.getById(inboxItem.id)).toEqual(inboxItem);
  });

  it("restores an older valid backup without inboxItems as an empty inbox", async () => {
    await storage.inbox.create(inboxItemInput);
    const backup = await service.createBackup();
    const {
      inboxItems: _omittedInbox,
      financeTransactions: _omittedFinanceTransactions,
      financeObligations: _omittedFinanceObligations,
      ...oldData
    } = backup.data;
    const oldBackup = service.parseBackup(JSON.stringify({ ...backup, data: oldData }));

    expect(oldBackup.data.financeTransactions).toEqual([]);
    expect(oldBackup.data.financeObligations).toEqual([]);
    expect(oldBackup.data.inboxItems).toEqual([]);
    await service.restoreBackup(oldBackup);
    expect(await storage.inbox.list()).toEqual([]);
    expect(await storage.projects.list()).toEqual([]);
  });

  it("rejects invalid JSON and structurally invalid backups", () => {
    expect(() => service.parseBackup("not-json")).toThrow(ValidationError);
    expect(() =>
      service.parseBackup(JSON.stringify({ app: "AliOS", backupVersion: 99 }))
    ).toThrow(ValidationError);
  });
});
