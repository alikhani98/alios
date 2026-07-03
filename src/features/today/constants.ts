import type {
  Level3,
  SmokingStatus,
  StressLevel,
  TaskPriority,
  TaskStatus,
} from "@/shared/types";

export const TASK_STATUS_OPTIONS: ReadonlyArray<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
  { value: "deferred", label: "Deferred" },
  { value: "cancelled", label: "Cancelled" },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
  deferred: "Deferred",
  cancelled: "Cancelled",
};

export const TASK_PRIORITY_OPTIONS: ReadonlyArray<{
  value: TaskPriority;
  label: string;
}> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const LEVEL_OPTIONS: ReadonlyArray<{ value: Level3; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "good", label: "Good" },
];

export const STRESS_OPTIONS: ReadonlyArray<{ value: StressLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const SMOKING_OPTIONS: ReadonlyArray<{
  value: SmokingStatus;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "reduced", label: "Reduced" },
  { value: "usual", label: "Usual" },
  { value: "increased", label: "Increased" },
];
