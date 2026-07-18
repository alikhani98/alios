import type { WeeklyPlan } from "@/shared/types";

export type SaveWeeklyPlanInput = Omit<WeeklyPlan, "id" | "createdAt" | "updatedAt">;

export interface WeeklyPlansRepository {
  getByWeekStart(weekStart: string): Promise<WeeklyPlan | undefined>;
  save(input: SaveWeeklyPlanInput): Promise<WeeklyPlan>;
}
