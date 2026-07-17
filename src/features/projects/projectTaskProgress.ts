import type { Task } from "@/shared/types";

export type ProjectTaskProgress = {
  total: number;
  completed: number;
};

export function getProjectTaskProgress(
  projectId: string,
  tasks: ReadonlyArray<Task>
): ProjectTaskProgress {
  const linkedTasks = tasks.filter((task) => task.projectId === projectId);

  return {
    total: linkedTasks.length,
    completed: linkedTasks.filter((task) => task.status === "done").length,
  };
}

export function createProjectTodayTasksPath(projectId: string): string {
  return `/today?${new URLSearchParams({ projectId }).toString()}`;
}
