import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import {
  dailyCheckinInput,
  decisionLogInput,
  goalInput,
  financeObligationInput,
  financeTransactionInput,
  inboxItemInput,
  journalEntryInput,
  knowledgeItemInput,
  lifeAreaInput,
  manualEntryInput,
  projectInput,
  settingInput,
  taskInput,
  routineInput,
} from "@/test/factories";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { BackupService } from "@/core/backup";
import {
  createBackupPreview,
  createBackupRestoreImpactPreview,
} from "../backupPreview";

describe("backup preview", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  let service: BackupService;

  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    service = new BackupService(storage.backup);
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
  });

  it("summarizes record counts for the restore preview", async () => {
    await storage.projects.create(projectInput);
    await storage.tasks.create(taskInput);
    await storage.goals.create(goalInput);
    await storage.lifeAreas.upsert(lifeAreaInput);
    await storage.decisions.create(decisionLogInput);
    await storage.manual.create(manualEntryInput);
    await storage.finance.createTransaction(financeTransactionInput);
    await storage.finance.createObligation(financeObligationInput);
    await storage.journal.create(journalEntryInput);
    await storage.knowledge.create(knowledgeItemInput);
    await storage.dailyCheckins.create(dailyCheckinInput);
    await storage.settings.create(settingInput);
    await storage.inbox.create(inboxItemInput);
    await storage.routines.create(routineInput);

    const preview = createBackupPreview(await service.createBackup());

    expect(preview.backupVersion).toBe(1);
    expect(new Date(preview.exportedAt).toISOString()).toBe(preview.exportedAt);
    expect(preview.totalRecords).toBe(14);
    expect(preview.tableCounts).toEqual([
      { key: "dailyCheckins", count: 1 },
      { key: "tasks", count: 1 },
      { key: "goals", count: 1 },
      { key: "lifeAreas", count: 1 },
      { key: "decisionLogEntries", count: 1 },
      { key: "manualEntries", count: 1 },
      { key: "financeTransactions", count: 1 },
      { key: "financeObligations", count: 1 },
      { key: "projects", count: 1 },
      { key: "journalEntries", count: 1 },
      { key: "knowledgeItems", count: 1 },
      { key: "settings", count: 1 },
      { key: "inboxItems", count: 1 },
      { key: "routines", count: 1 },
      { key: "weeklyPlans", count: 0 },
    ]);
  });

  it("compares the selected backup with current local data before restore", async () => {
    await storage.tasks.create(taskInput);
    await storage.projects.create(projectInput);
    const backup = await service.createBackup();

    const impact = createBackupRestoreImpactPreview(backup, {
      dailyCheckins: 0, tasks: 4, goals: 0, lifeAreas: 0, decisionLogEntries: 0,
      manualEntries: 0, financeTransactions: 0, financeObligations: 0, projects: 0,
      journalEntries: 0, knowledgeItems: 0, settings: 0, inboxItems: 0,
      routines: 0, weeklyPlans: 2,
    });

    expect(impact).toMatchObject({
      currentTotalRecords: 6,
      backupTotalRecords: 2,
      difference: -4,
      changedTableCount: 3,
    });
    expect(impact.tableImpacts).toEqual(expect.arrayContaining([
      { key: "tasks", currentCount: 4, backupCount: 1, difference: -3 },
      { key: "projects", currentCount: 0, backupCount: 1, difference: 1 },
      { key: "weeklyPlans", currentCount: 2, backupCount: 0, difference: -2 },
    ]));
  });
});
