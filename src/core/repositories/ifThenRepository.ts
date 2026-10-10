import type { IfThenPlan } from "@/shared/types";

export type AddIfThenPlanInput = Pick<
  IfThenPlan,
  "ifTrigger" | "thenAction" | "linkedUrgeType"
> & {
  isActive?: boolean;
};

export interface IfThenRepository {
  getActivePlans(): Promise<IfThenPlan[]>;
  getAllPlans(): Promise<IfThenPlan[]>;
  addPlan(data: AddIfThenPlanInput): Promise<void>;
  toggleActive(id: string): Promise<void>;
  deletePlan(id: string): Promise<void>;
}
