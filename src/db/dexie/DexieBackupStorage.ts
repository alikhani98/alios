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
        decisionLogEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
      ] = await Promise.all([
        this.database.dailyCheckins.toArray(),
        this.database.tasks.toArray(),
        this.database.decisionLogEntries.toArray(),
        this.database.financeTransactions.toArray(),
        this.database.financeObligations.toArray(),
        this.database.projects.toArray(),
        this.database.journalEntries.toArray(),
        this.database.knowledgeItems.toArray(),
        this.database.settings.toArray(),
        this.database.inboxItems.toArray(),
      ]);

      return {
        dailyCheckins,
        tasks,
        decisionLogEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
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
      this.database.decisionLogEntries,
      this.database.financeTransactions,
      this.database.financeObligations,
      this.database.projects,
      this.database.journalEntries,
      this.database.knowledgeItems,
      this.database.settings,
      this.database.inboxItems,
    ];

    try {
      await this.database.transaction("rw", tables, async () => {
        await Promise.all(tables.map((table) => table.clear()));
        await Promise.all([
          this.database.dailyCheckins.bulkPut(data.dailyCheckins),
          this.database.tasks.bulkPut(data.tasks),
          this.database.decisionLogEntries.bulkPut(data.decisionLogEntries),
          this.database.financeTransactions.bulkPut(data.financeTransactions),
          this.database.financeObligations.bulkPut(data.financeObligations),
          this.database.projects.bulkPut(data.projects),
          this.database.journalEntries.bulkPut(data.journalEntries),
          this.database.knowledgeItems.bulkPut(data.knowledgeItems),
          this.database.settings.bulkPut(data.settings),
          this.database.inboxItems.bulkPut(data.inboxItems),
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
        decisionLogEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
      ] = await Promise.all([
        this.database.dailyCheckins.count(),
        this.database.tasks.count(),
        this.database.decisionLogEntries.count(),
        this.database.financeTransactions.count(),
        this.database.financeObligations.count(),
        this.database.projects.count(),
        this.database.journalEntries.count(),
        this.database.knowledgeItems.count(),
        this.database.settings.count(),
        this.database.inboxItems.count(),
      ]);

      return {
        dailyCheckins,
        tasks,
        decisionLogEntries,
        financeTransactions,
        financeObligations,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
        inboxItems,
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
      this.database.decisionLogEntries,
      this.database.financeTransactions,
      this.database.financeObligations,
      this.database.projects,
      this.database.journalEntries,
      this.database.knowledgeItems,
      this.database.settings,
      this.database.inboxItems,
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
