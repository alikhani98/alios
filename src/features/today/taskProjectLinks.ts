import type { Project, Task } from "@/shared/types";
import { createTodayTasksPath } from "@/features/routines/routineTaskLinks";

export { createTodayTasksPath };

export function createLinkedProjectPath(projectId: string): string {
  const searchParams = new URLSearchParams({ focusId: projectId });
  return `/projects?${searchParams.toString()}`;
}

export function createAllTodayTasksPath(): string {
  return createTodayTasksPath();
}

export function findProjectFilter(
  projectId: string | null,
  projects: ReadonlyArray<Project>
): Project | undefined {
  return projectId
    ? projects.find((project) => project.id === projectId)
    : undefined;
}

export function findLinkedProject(
  task: Pick<Task, "projectId">,
  projects: ReadonlyArray<Project>
): Project | undefined {
  if (!task.projectId) {
    return undefined;
  }

  return projects.find((project) => project.id === task.projectId);
}
