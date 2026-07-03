import type {
  CreateJournalEntryInput,
  JournalRepository,
  UpdateJournalEntryInput,
} from "@/core/repositories";
import { journalEntrySchema, type JournalEntry } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieJournalRepository
  extends DexieRepositoryBase
  implements JournalRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<JournalEntry[]> {
    return this.execute("listing journal entries", async () => {
      const records = await this.database.journalEntries.toArray();
      return records.map((record) => journalEntrySchema.parse(record));
    });
  }

  async getById(id: string): Promise<JournalEntry | undefined> {
    return this.execute("reading a journal entry", async () => {
      const record = await this.database.journalEntries.get(id);
      return record === undefined ? undefined : journalEntrySchema.parse(record);
    });
  }

  async create(input: CreateJournalEntryInput): Promise<JournalEntry> {
    return this.execute("creating a journal entry", async () => {
      const entry = journalEntrySchema.parse({ ...input, ...this.createMetadata() });
      await this.database.journalEntries.add(entry);
      return entry;
    });
  }

  async update(
    id: string,
    input: UpdateJournalEntryInput
  ): Promise<JournalEntry> {
    return this.execute("updating a journal entry", () =>
      this.database.transaction("rw", this.database.journalEntries, async () => {
        const current = this.requireEntity(
          "JournalEntry",
          id,
          await this.database.journalEntries.get(id)
        );
        const entry = journalEntrySchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.journalEntries.put(entry);
        return entry;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a journal entry", () =>
      this.database.transaction("rw", this.database.journalEntries, async () => {
        this.requireEntity(
          "JournalEntry",
          id,
          await this.database.journalEntries.get(id)
        );
        await this.database.journalEntries.delete(id);
      })
    );
  }
}
