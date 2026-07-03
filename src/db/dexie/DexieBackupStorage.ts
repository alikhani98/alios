import type { AliosBackupData, BackupStorage } from "@/core/backup";
import { StorageError } from "@/core/errors";
import type { AliosDatabase } from "./db";

export class DexieBackupStorage implements BackupStorage {
  constructor(private readonly database: AliosDatabase) {}

  async readAll(): Promise<AliosBackupData> {
    try {
      const [
        dailyCheckins,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
      ] = await Promise.all([
        this.database.dailyCheckins.toArray(),
        this.database.tasks.toArray(),
        this.database.projects.toArray(),
        this.database.journalEntries.toArray(),
        this.database.knowledgeItems.toArray(),
        this.database.settings.toArray(),
      ]);

      return {
        dailyCheckins,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        settings,
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
      this.database.projects,
      this.database.journalEntries,
      this.database.knowledgeItems,
      this.database.settings,
    ];

    try {
      await this.database.transaction("rw", tables, async () => {
        await Promise.all(tables.map((table) => table.clear()));
        await Promise.all([
          this.database.dailyCheckins.bulkPut(data.dailyCheckins),
          this.database.tasks.bulkPut(data.tasks),
          this.database.projects.bulkPut(data.projects),
          this.database.journalEntries.bulkPut(data.journalEntries),
          this.database.knowledgeItems.bulkPut(data.knowledgeItems),
          this.database.settings.bulkPut(data.settings),
        ]);
      });
    } catch (error) {
      throw new StorageError(
        "AliOS data could not be restored. Existing data was left unchanged.",
        { cause: error }
      );
    }
  }
}
