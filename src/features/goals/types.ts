import type { Goal } from "@/shared/types";

export type GoalFormValues = {
  title: string;
  description: string;
  area: Goal["area"];
  timeframe: Goal["timeframe"];
  status: Goal["status"];
  importance: Goal["importance"];
  progressPercent: string;
  targetDate: string;
  reviewIntervalDays: string;
  tagsText: string;
};

export type GoalFormSeed = Pick<
  Goal,
  | "title"
  | "description"
  | "area"
  | "timeframe"
  | "status"
  | "importance"
  | "progressPercent"
  | "targetDate"
  | "reviewIntervalDays"
  | "tags"
>;
