import type {
  CreateJournalEntryInput,
  JournalRepository,
  UpdateJournalEntryInput,
} from "@/core/repositories";
import type { JournalEntry } from "@/shared/types";
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
    return this.unavailable("Listing journal entries");
  }

  async getById(_id: string): Promise<JournalEntry | undefined> {
    return this.unavailable("Reading a journal entry");
  }

  async create(_input: CreateJournalEntryInput): Promise<JournalEntry> {
    return this.unavailable("Creating a journal entry");
  }

  async update(
    _id: string,
    _input: UpdateJournalEntryInput
  ): Promise<JournalEntry> {
    return this.unavailable("Updating a journal entry");
  }

  async delete(_id: string): Promise<void> {
    return this.unavailable("Deleting a journal entry");
  }
}
