import type { DecisionLogEntry } from "@/shared/types";

export type CreateDecisionLogEntryInput = Omit<
  DecisionLogEntry,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateDecisionLogEntryInput = Partial<CreateDecisionLogEntryInput>;

export interface DecisionLogRepository {
  list(): Promise<DecisionLogEntry[]>;
  create(input: CreateDecisionLogEntryInput): Promise<DecisionLogEntry>;
  update(
    id: string,
    input: UpdateDecisionLogEntryInput
  ): Promise<DecisionLogEntry>;
  delete(id: string): Promise<void>;
}
