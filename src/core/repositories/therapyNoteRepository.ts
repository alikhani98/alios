import type { TherapyNote } from "@/shared/types";

export type AddTherapyNoteInput = Pick<
  TherapyNote,
  "date" | "category" | "content"
>;

export interface TherapyNoteRepository {
  addNote(data: AddTherapyNoteInput): Promise<void>;
  getNotesByDateRange(from: string, to: string): Promise<TherapyNote[]>;
  updateNote(id: string, content: string): Promise<void>;
  deleteNote(id: string): Promise<void>;
  getRecentNotes(days: number): Promise<TherapyNote[]>;
}
