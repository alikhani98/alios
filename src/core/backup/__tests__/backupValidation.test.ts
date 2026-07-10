import { afterEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/core/errors";
import {
  dailyCheckinRecord,
  decisionLogRecord,
  financeObligationRecord,
  financeTransactionRecord,
  inboxItemRecord,
  journalEntryRecord,
  knowledgeItemRecord,
  projectRecord,
  settingRecord,
  taskRecord,
} from "@/test/factories";

import {
  BACKUP_ERROR_CODES,
  validateAndMigrateBackup,
  validateAndMigrateBackupPayload,
} from "../backupValidation";
import { migrateBackupPayload, normalizeBackupData } from "../backupMigration";
import { ALIOS_BACKUP_APP, ALIOS_BACKUP_VERSION } from "../types";

describe("backup validation and migration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes missing additive arrays without mutating the source payload", () => {
    const payload = {
      app: ALIOS_BACKUP_APP,
      backupVersion: ALIOS_BACKUP_VERSION,
      exportedAt: "2026-07-05T08:30:00.000Z",
      data: {
        dailyCheckins: [dailyCheckinRecord],
        tasks: [taskRecord],
        projects: [projectRecord],
        journalEntries: [journalEntryRecord],
        knowledgeItems: [knowledgeItemRecord],
        settings: [settingRecord],
      },
    };
    const snapshot = JSON.parse(JSON.stringify(payload));

    const migrated = migrateBackupPayload(payload as never);

    expect(payload).toEqual(snapshot);
    expect(migrated.data.dailyCheckins).toEqual([dailyCheckinRecord]);
    expect(migrated.data.tasks).toEqual([taskRecord]);
    expect(migrated.data.decisionLogEntries).toEqual([]);
    expect(migrated.data.financeTransactions).toEqual([]);
    expect(migrated.data.financeObligations).toEqual([]);
    expect(migrated.data.inboxItems).toEqual([]);
    expect(migrated.data.tasks).not.toBe(payload.data.tasks);
  });

  it("accepts older backup payloads with missing additive arrays", () => {
    const backup = validateAndMigrateBackupPayload({
      app: ALIOS_BACKUP_APP,
      backupVersion: ALIOS_BACKUP_VERSION,
      exportedAt: "2026-07-05T08:30:00.000Z",
      data: {
        dailyCheckins: [dailyCheckinRecord],
        tasks: [taskRecord],
        projects: [projectRecord],
        journalEntries: [journalEntryRecord],
        knowledgeItems: [knowledgeItemRecord],
        settings: [settingRecord],
      },
    });

    expect(backup.data.decisionLogEntries).toEqual([]);
    expect(backup.data.financeTransactions).toEqual([]);
    expect(backup.data.financeObligations).toEqual([]);
    expect(backup.data.inboxItems).toEqual([]);
  });

  it("rejects invalid JSON before any restore write can happen", () => {
    expect(() => validateAndMigrateBackup("{")).toThrow(ValidationError);
    try {
      validateAndMigrateBackup("{");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(
        BACKUP_ERROR_CODES.invalidJson
      );
    }
  });

  it("rejects backups for a different app", () => {
    expect(() =>
      validateAndMigrateBackup(
        JSON.stringify({
          app: "Other App",
          backupVersion: ALIOS_BACKUP_VERSION,
          exportedAt: "2026-07-05T08:30:00.000Z",
          data: {},
        })
      )
    ).toThrow(ValidationError);
  });

  it("rejects backups with a missing data object", () => {
    expect(() =>
      validateAndMigrateBackup(
        JSON.stringify({
          app: ALIOS_BACKUP_APP,
          backupVersion: ALIOS_BACKUP_VERSION,
          exportedAt: "2026-07-05T08:30:00.000Z",
        })
      )
    ).toThrow(ValidationError);
  });

  it("rejects invalid array types and malformed records", () => {
    expect(() =>
      validateAndMigrateBackup(
        JSON.stringify({
          app: ALIOS_BACKUP_APP,
          backupVersion: ALIOS_BACKUP_VERSION,
          exportedAt: "2026-07-05T08:30:00.000Z",
          data: {
            dailyCheckins: [dailyCheckinRecord],
            tasks: "not-an-array",
            projects: [projectRecord],
            journalEntries: [journalEntryRecord],
            knowledgeItems: [knowledgeItemRecord],
            settings: [settingRecord],
          },
        })
      )
    ).toThrow(ValidationError);

    expect(() =>
      validateAndMigrateBackup(
        JSON.stringify({
          app: ALIOS_BACKUP_APP,
          backupVersion: ALIOS_BACKUP_VERSION,
          exportedAt: "2026-07-05T08:30:00.000Z",
          data: {
            dailyCheckins: [dailyCheckinRecord],
            tasks: [{ ...taskRecord, title: 42 }],
            projects: [projectRecord],
            journalEntries: [journalEntryRecord],
            knowledgeItems: [knowledgeItemRecord],
            settings: [settingRecord],
          },
        })
      )
    ).toThrow(ValidationError);
  });

  it("keeps normalized arrays stable when called with already-valid data", () => {
    const input = {
      dailyCheckins: [dailyCheckinRecord],
      tasks: [taskRecord],
      decisionLogEntries: [decisionLogRecord],
      financeTransactions: [financeTransactionRecord],
      financeObligations: [financeObligationRecord],
      projects: [projectRecord],
      journalEntries: [journalEntryRecord],
      knowledgeItems: [knowledgeItemRecord],
      settings: [settingRecord],
      inboxItems: [inboxItemRecord],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    const normalized = normalizeBackupData(input);

    expect(input).toEqual(snapshot);
    expect(normalized).toEqual(input);
    expect(normalized.tasks).not.toBe(input.tasks);
    expect(normalized.inboxItems).not.toBe(input.inboxItems);
  });
});
