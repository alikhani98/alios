import type { AddUrgeEntryInput, UrgeRepository } from "@/core/repositories";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { urgeEntrySchema, type UrgeEntry } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, days - 1));
  return getLocalDateKey(date);
}

function sortNewestFirst(entries: UrgeEntry[]): UrgeEntry[] {
  return [...entries].sort((first, second) => {
    const dateCompare = second.date.localeCompare(first.date);
    return dateCompare === 0 ? second.time.localeCompare(first.time) : dateCompare;
  });
}

export class DexieUrgeRepository
  extends DexieRepositoryBase
  implements UrgeRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async addEntry(entry: AddUrgeEntryInput): Promise<void> {
    return this.execute("saving an urge entry", async () => {
      const createdAt = new Date().toISOString();
      const record = urgeEntrySchema.parse({
        ...entry,
        id: crypto.randomUUID(),
        createdAt,
      });

      await this.database.urgeEntries.put(record);
    });
  }

  async getEntriesByDate(date: string): Promise<UrgeEntry[]> {
    return this.execute("listing urge entries by date", async () => {
      const records = await this.database.urgeEntries
        .where("date")
        .equals(date)
        .toArray();

      return sortNewestFirst(records.map((record) => urgeEntrySchema.parse(record)));
    });
  }

  async getRecentEntries(days: number): Promise<UrgeEntry[]> {
    return this.execute("listing recent urge entries", async () => {
      if (days <= 0) {
        return [];
      }

      const records = await this.database.urgeEntries
        .where("date")
        .aboveOrEqual(getDateDaysAgo(days))
        .toArray();

      return sortNewestFirst(records.map((record) => urgeEntrySchema.parse(record)));
    });
  }
}
