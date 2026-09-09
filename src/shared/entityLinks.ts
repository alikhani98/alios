import type { Goal, Project, Task } from "@/shared/types";

export type LinkableRecord = {
  projectId?: string;
  goalId?: string;
  taskId?: string;
};

export function createProjectFocusPath(projectId: string): string {
  return `/projects?${new URLSearchParams({ focusId: projectId }).toString()}`;
}

export function createGoalFocusPath(goalId: string): string {
  return `/goals?${new URLSearchParams({ focusId: goalId }).toString()}`;
}

export function createTaskFocusPath(taskId: string): string {
  return `/today?${new URLSearchParams({ focusId: taskId }).toString()}`;
}

export function findLinkedProjectById(
  record: Pick<LinkableRecord, "projectId">,
  projects: ReadonlyArray<Project>
): Project | undefined {
  return record.projectId
    ? projects.find((project) => project.id === record.projectId)
    : undefined;
}

export function findLinkedGoalById(
  record: Pick<LinkableRecord, "goalId">,
  goals: ReadonlyArray<Goal>
): Goal | undefined {
  return record.goalId
    ? goals.find((goal) => goal.id === record.goalId)
    : undefined;
}

export function findLinkedTaskById(
  record: Pick<LinkableRecord, "taskId">,
  tasks: ReadonlyArray<Task>
): Task | undefined {
  return record.taskId
    ? tasks.find((task) => task.id === record.taskId)
    : undefined;
}
