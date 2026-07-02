import type { JournalEntry } from "@/shared/types";

export type CreateJournalEntryInput = Omit<
  JournalEntry,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;

export interface JournalRepository {
  list(): Promise<JournalEntry[]>;
  getById(id: string): Promise<JournalEntry | undefined>;
  create(input: CreateJournalEntryInput): Promise<JournalEntry>;
  update(id: string, input: UpdateJournalEntryInput): Promise<JournalEntry>;
  delete(id: string): Promise<void>;
}
