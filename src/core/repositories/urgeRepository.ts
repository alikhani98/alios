import type { UrgeEntry } from "@/shared/types";

export type AddUrgeEntryInput = Omit<UrgeEntry, "id" | "createdAt">;

export interface UrgeRepository {
  addEntry(entry: AddUrgeEntryInput): Promise<void>;
  getEntriesByDate(date: string): Promise<UrgeEntry[]>;
  getRecentEntries(days: number): Promise<UrgeEntry[]>;
}
