import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/core/errors";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  dailyCheckinInput,
  decisionLogInput,
  goalInput,
  financeObligationInput,
  financeTransactionInput,
  journalEntryInput,
  inboxItemInput,
  knowledgeItemInput,
  lifeAreaInput,
  manualEntryInput,
  projectInput,
  settingInput,
  taskInput,
  routineInput,
  weeklyPlanInput,
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

  it("round-trips every supported table and the Goal → Project → Task links", async () => {
    const goal = await storage.goals.create(goalInput);
    const project = await storage.projects.create({
      ...projectInput,
      goalId: goal.id,
    });
    const task = await storage.tasks.create({
      ...taskInput,
      projectId: project.id,
    });
    const financeTransaction = await storage.finance.createTransaction(
      financeTransactionInput
    );
    const financeObligation = await storage.finance.createObligation(
      financeObligationInput
    );
    const lifeArea = await storage.lifeAreas.upsert(lifeAreaInput);
    const decisionLogEntry = await storage.decisions.create(decisionLogInput);
    const manualEntry = await storage.manual.create(manualEntryInput);
    const journalEntry = await storage.journal.create(journalEntryInput);
    const knowledgeItem = await storage.knowledge.create(knowledgeItemInput);
    const dailyCheckin = await storage.dailyCheckins.create(dailyCheckinInput);
    const setting = await storage.settings.create(settingInput);
    const inboxItem = await storage.inbox.create(inboxItemInput);
    const routine = await storage.routines.create(routineInput);
    const weeklyPlan = await storage.weeklyPlans.save({ ...weeklyPlanInput, goalId: goal.id, projectId: project.id, taskId: task.id });

    const backup = await service.createBackup();

    expect(backup.app).toBe("AliOS");
    expect(backup.backupVersion).toBe(1);
    expect(new Date(backup.exportedAt).toISOString()).toBe(backup.exportedAt);
    expect(Object.keys(backup.data).sort()).toEqual(
      [
        "dailyCheckins",
        "tasks",
        "goals",
        "lifeAreas",
        "decisionLogEntries",
        "manualEntries",
        "financeTransactions",
        "financeObligations",
        "projects",
        "journalEntries",
        "knowledgeItems",
        "settings",
        "inboxItems",
        "routines",
        "weeklyPlans",
      ].sort()
    );
    expect(backup.data.projects).toEqual([project]);
    expect(backup.data.tasks).toEqual([task]);
    expect(backup.data.routines).toEqual([routine]);
    expect(backup.data.weeklyPlans).toEqual([weeklyPlan]);
    expect(backup.data.goals).toEqual([goal]);
    expect(backup.data.projects[0]?.goalId).toBe(goal.id);
    expect(backup.data.tasks[0]?.projectId).toBe(project.id);
    expect(backup.data.lifeAreas).toEqual([lifeArea]);
    expect(backup.data.financeTransactions).toEqual([financeTransaction]);
    expect(backup.data.financeObligations).toEqual([financeObligation]);
    expect(backup.data.journalEntries).toEqual([journalEntry]);
    expect(backup.data.knowledgeItems).toEqual([knowledgeItem]);
    expect(backup.data.dailyCheckins).toEqual([dailyCheckin]);
    expect(backup.data.decisionLogEntries).toEqual([decisionLogEntry]);
    expect(backup.data.manualEntries).toEqual([manualEntry]);
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
      goals: 0,
      lifeAreas: 0,
      decisionLogEntries: 0,
      manualEntries: 0,
      financeTransactions: 0,
      financeObligations: 0,
      projects: 0,
      journalEntries: 0,
      knowledgeItems: 0,
      settings: 0,
      inboxItems: 0,
      routines: 0,
      weeklyPlans: 0,
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");

    await service.restoreBackup(backup);

    expect(await storage.projects.getById(project.id)).toEqual(project);
    expect(await storage.tasks.getById(task.id)).toEqual(task);
    expect(await storage.goals.getById(goal.id)).toEqual(goal);
    expect(await storage.routines.list()).toEqual([routine]);
    expect(await storage.weeklyPlans.getByWeekStart(weeklyPlan.weekStart)).toEqual(weeklyPlan);
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
    expect(await storage.decisions.list()).toEqual([decisionLogEntry]);
    expect(await storage.manual.list()).toEqual([manualEntry]);
    expect(await storage.dailyCheckins.getByDate(dailyCheckin.date)).toEqual(
      dailyCheckin
    );
    expect(await storage.settings.getByKey(setting.key)).toEqual(setting);
    expect(await storage.inbox.getById(inboxItem.id)).toEqual(inboxItem);

    const restoredBackup = await service.createBackup();
    expect(restoredBackup.data).toEqual(backup.data);
    expect(restoredBackup.data.projects[0]?.goalId).toBe(goal.id);
    expect(restoredBackup.data.tasks[0]?.projectId).toBe(project.id);
  });

  it("restores an older valid backup without inboxItems as an empty inbox", async () => {
    await storage.inbox.create(inboxItemInput);
    const backup = await service.createBackup();
    const {
      inboxItems: _omittedInbox,
      goals: _omittedGoals,
      decisionLogEntries: _omittedDecisionLogEntries,
      manualEntries: _omittedManualEntries,
      financeTransactions: _omittedFinanceTransactions,
      financeObligations: _omittedFinanceObligations,
      ...oldData
    } = backup.data;
    const oldBackup = service.parseBackup(JSON.stringify({ ...backup, data: oldData }));

    expect(oldBackup.data.financeTransactions).toEqual([]);
    expect(oldBackup.data.financeObligations).toEqual([]);
    expect(oldBackup.data.goals).toEqual([]);
    expect(oldBackup.data.decisionLogEntries).toEqual([]);
    expect(oldBackup.data.manualEntries).toEqual([]);
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

  it("does not write anything when restore validation fails", async () => {
    const replaceAll = vi.fn();
    const invalidStorage = {
      readAll: vi.fn(),
      replaceAll,
      getSummary: vi.fn(),
      clearAll: vi.fn(),
    };
    const invalidService = new BackupService(invalidStorage);

    await expect(
      invalidService.restoreBackup({
        app: "AliOS",
        backupVersion: 1,
        exportedAt: "2026-07-05T08:30:00.000Z",
      } as never)
    ).rejects.toBeInstanceOf(ValidationError);
    expect(replaceAll).not.toHaveBeenCalled();
  });
});
