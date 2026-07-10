import type { ManualEntry } from "@/shared/types";

export type CreateManualEntryInput = Omit<
  ManualEntry,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateManualEntryInput = Partial<CreateManualEntryInput>;

export interface ManualRepository {
  list(): Promise<ManualEntry[]>;
  getById(id: string): Promise<ManualEntry | undefined>;
  create(input: CreateManualEntryInput): Promise<ManualEntry>;
  update(id: string, input: UpdateManualEntryInput): Promise<ManualEntry>;
  delete(id: string): Promise<void>;
}
