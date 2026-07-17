import type { Project, Task } from "@/shared/types";

export function createLinkedProjectPath(projectId: string): string {
  const searchParams = new URLSearchParams({ focusId: projectId });
  return `/projects?${searchParams.toString()}`;
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
