import type { Goal } from "@/shared/types";

export type CreateGoalInput = Omit<
  Goal,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateGoalInput = Partial<CreateGoalInput>;

export interface GoalsRepository {
  list(): Promise<Goal[]>;
  getById(id: string): Promise<Goal | undefined>;
  create(input: CreateGoalInput): Promise<Goal>;
  update(id: string, input: UpdateGoalInput): Promise<Goal>;
  delete(id: string): Promise<void>;
  markReviewed(id: string): Promise<Goal>;
  updateProgress(id: string, progressPercent: number): Promise<Goal>;
  markCompleted(id: string): Promise<Goal>;
  reactivate(id: string): Promise<Goal>;
}
