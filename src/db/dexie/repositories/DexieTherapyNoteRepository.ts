import type {
  AddTherapyNoteInput,
  TherapyNoteRepository,
} from "@/core/repositories";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { therapyNoteSchema, type TherapyNote } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, days - 1));
  return getLocalDateKey(date);
}

function sortNewestFirst(notes: TherapyNote[]): TherapyNote[] {
  return [...notes].sort((first, second) => {
    const dateCompare = second.date.localeCompare(first.date);
    return dateCompare === 0
      ? second.createdAt.localeCompare(first.createdAt)
      : dateCompare;
  });
}

export class DexieTherapyNoteRepository
  extends DexieRepositoryBase
  implements TherapyNoteRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async addNote(data: AddTherapyNoteInput): Promise<void> {
    return this.execute("saving a therapy note", async () => {
      const now = new Date().toISOString();
      const record = therapyNoteSchema.parse({
        ...data,
        id: crypto.randomUUID(),
        content: data.content.trim(),
        createdAt: now,
        updatedAt: now,
      });

      await this.database.therapyNotes.put(record);
    });
  }

  async getNotesByDateRange(
    from: string,
    to: string
  ): Promise<TherapyNote[]> {
    return this.execute("listing therapy notes by date range", async () => {
      const records = await this.database.therapyNotes
        .where("date")
        .between(from, to, true, true)
        .toArray();

      return sortNewestFirst(
        records.map((record) => therapyNoteSchema.parse(record))
      );
    });
  }

  async updateNote(id: string, content: string): Promise<void> {
    return this.execute("updating a therapy note", async () => {
      const current = this.requireEntity(
        "Therapy note",
        id,
        await this.database.therapyNotes.get(id)
      );
      const record = therapyNoteSchema.parse({
        ...current,
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      });

      await this.database.therapyNotes.put(record);
    });
  }

  async deleteNote(id: string): Promise<void> {
    return this.execute("deleting a therapy note", async () => {
      await this.database.therapyNotes.delete(id);
    });
  }

  async getRecentNotes(days: number): Promise<TherapyNote[]> {
    return this.execute("listing recent therapy notes", async () => {
      if (days <= 0) {
        return [];
      }

      const records = await this.database.therapyNotes
        .where("date")
        .aboveOrEqual(getDateDaysAgo(days))
        .toArray();

      return sortNewestFirst(
        records.map((record) => therapyNoteSchema.parse(record))
      );
    });
  }
}
