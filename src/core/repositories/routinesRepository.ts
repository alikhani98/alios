import type { Routine } from "@/shared/types";

export type CreateRoutineInput = Omit<Routine, "id" | "createdAt" | "updatedAt">;
export type UpdateRoutineInput = Partial<CreateRoutineInput>;

export interface RoutinesRepository {
  list(): Promise<Routine[]>;
  create(input: CreateRoutineInput): Promise<Routine>;
  update(id: string, input: UpdateRoutineInput): Promise<Routine>;
  delete(id: string): Promise<void>;
}
