import type { ProjectPriority, ProjectStatus } from "@/shared/types";

export const PROJECT_STATUS_OPTIONS: ReadonlyArray<{
  value: Exclude<ProjectStatus, "archived">;
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "waiting", label: "Waiting" },
  { value: "later", label: "Later" },
  { value: "completed", label: "Completed" },
];

export const PROJECT_PRIORITY_OPTIONS: ReadonlyArray<{
  value: ProjectPriority;
  label: string;
}> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  waiting: "Waiting",
  later: "Later",
  completed: "Completed",
  archived: "Archived",
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
