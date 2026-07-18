import type {
  AliosBackupData,
  BackupStorage,
  LocalDataSummary,
} from "@/core/backup";
import { StorageError } from "@/core/errors";
import type { AliosDatabase } from "./db";

export class DexieBackupStorage implements BackupStorage {
  constructor(private readonly database: AliosDatabase) {}

  async readAll(): Promise<AliosBackupData> {
    try {
      const [
        dailyCheckins,
        tasks,
        goals,
        lifeAreas,
        decisionLogEntries,
        manualEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
        routines,
        weeklyPlans,
      ] = await Promise.all([
        this.database.dailyCheckins.toArray(),
        this.database.tasks.toArray(),
        this.database.goals.toArray(),
        this.database.lifeAreas.toArray(),
        this.database.decisionLogEntries.toArray(),
        this.database.manualEntries.toArray(),
        this.database.financeTransactions.toArray(),
        this.database.financeObligations.toArray(),
        this.database.projects.toArray(),
        this.database.journalEntries.toArray(),
        this.database.knowledgeItems.toArray(),
        this.database.settings.toArray(),
        this.database.inboxItems.toArray(),
        this.database.routines.toArray(),
        this.database.weeklyPlans.toArray(),
      ]);

      return {
        dailyCheckins,
        tasks,
        goals,
        lifeAreas,
        decisionLogEntries,
        manualEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
        routines,
        weeklyPlans,
      };
    } catch (error) {
      throw new StorageError("AliOS data could not be exported.", {
        cause: error,
      });
    }
  }

  async replaceAll(data: AliosBackupData): Promise<void> {
    const tables = [
      this.database.dailyCheckins,
      this.database.tasks,
      this.database.goals,
      this.database.lifeAreas,
      this.database.decisionLogEntries,
      this.database.manualEntries,
      this.database.financeTransactions,
      this.database.financeObligations,
      this.database.projects,
      this.database.journalEntries,
      this.database.knowledgeItems,
      this.database.settings,
      this.database.inboxItems,
      this.database.routines,
      this.database.weeklyPlans,
    ];

    try {
      await this.database.transaction("rw", tables, async () => {
        await Promise.all(tables.map((table) => table.clear()));
        await Promise.all([
          this.database.dailyCheckins.bulkPut(data.dailyCheckins),
          this.database.tasks.bulkPut(data.tasks),
          this.database.goals.bulkPut(data.goals),
          this.database.lifeAreas.bulkPut(data.lifeAreas),
          this.database.decisionLogEntries.bulkPut(data.decisionLogEntries),
          this.database.manualEntries.bulkPut(data.manualEntries),
          this.database.financeTransactions.bulkPut(data.financeTransactions),
          this.database.financeObligations.bulkPut(data.financeObligations),
          this.database.projects.bulkPut(data.projects),
          this.database.journalEntries.bulkPut(data.journalEntries),
          this.database.knowledgeItems.bulkPut(data.knowledgeItems),
          this.database.settings.bulkPut(data.settings),
          this.database.inboxItems.bulkPut(data.inboxItems),
          this.database.routines.bulkPut(data.routines),
          this.database.weeklyPlans.bulkPut(data.weeklyPlans),
        ]);
      });
    } catch (error) {
      throw new StorageError(
        "AliOS data could not be restored. Existing data was left unchanged.",
        { cause: error }
      );
    }
  }

  async getSummary(): Promise<LocalDataSummary> {
    try {
      const [
        dailyCheckins,
        tasks,
        goals,
        lifeAreas,
        decisionLogEntries,
        manualEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
        routines,
        weeklyPlans,
      ] = await Promise.all([
        this.database.dailyCheckins.count(),
        this.database.tasks.count(),
        this.database.goals.count(),
        this.database.lifeAreas.count(),
        this.database.decisionLogEntries.count(),
        this.database.manualEntries.count(),
        this.database.financeTransactions.count(),
        this.database.financeObligations.count(),
        this.database.projects.count(),
        this.database.journalEntries.count(),
        this.database.knowledgeItems.count(),
        this.database.settings.count(),
        this.database.inboxItems.count(),
        this.database.routines.count(),
        this.database.weeklyPlans.count(),
      ]);

      return {
        dailyCheckins,
        tasks,
        goals,
        lifeAreas,
        decisionLogEntries,
        manualEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
        routines,
        weeklyPlans,
      };
    } catch (error) {
      throw new StorageError("AliOS data counts could not be loaded.", {
        cause: error,
      });
    }
  }

  async clearAll(): Promise<void> {
    const tables = [
      this.database.dailyCheckins,
      this.database.tasks,
      this.database.goals,
      this.database.lifeAreas,
      this.database.decisionLogEntries,
      this.database.manualEntries,
      this.database.financeTransactions,
      this.database.financeObligations,
      this.database.projects,
      this.database.journalEntries,
      this.database.knowledgeItems,
      this.database.settings,
      this.database.inboxItems,
      this.database.routines,
      this.database.weeklyPlans,
    ];

    try {
      await this.database.transaction("rw", tables, async () => {
        await Promise.all(tables.map((table) => table.clear()));
      });
    } catch (error) {
      throw new StorageError(
        "AliOS local data could not be cleared. Existing data was left unchanged.",
        { cause: error }
      );
    }
  }
}
