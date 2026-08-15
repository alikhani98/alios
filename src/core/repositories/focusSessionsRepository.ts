import type { FocusSession } from "@/shared/types";

export type CreateFocusSessionInput = Omit<FocusSession, "id">;

export interface FocusSessionsRepository {
  list(): Promise<FocusSession[]>;
  create(input: CreateFocusSessionInput): Promise<FocusSession>;
}
