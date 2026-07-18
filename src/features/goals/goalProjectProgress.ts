import type { Project, Task } from "@/shared/types";

export type GoalProjectProgress = {
  projectCount: number;
  completedProjectCount: number;
  taskCount: number;
  completedTaskCount: number;
  completionPercent: number | null;
};

export function getGoalProjectProgress(
  goalId: string,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): GoalProjectProgress {
  const linkedProjects = projects.filter((project) => project.goalId === goalId);
  const linkedProjectIds = new Set(linkedProjects.map((project) => project.id));
  const linkedTasks = tasks.filter(
    (task) => task.projectId && linkedProjectIds.has(task.projectId)
  );
  const completedProjectCount = linkedProjects.filter(
    (project) => project.status === "completed"
  ).length;
  const completedTaskCount = linkedTasks.filter((task) => task.status === "done").length;
  const completionPercent = linkedTasks.length > 0
    ? Math.round((completedTaskCount / linkedTasks.length) * 100)
    : linkedProjects.length > 0
      ? Math.round((completedProjectCount / linkedProjects.length) * 100)
      : null;

  return {
    projectCount: linkedProjects.length,
    completedProjectCount,
    taskCount: linkedTasks.length,
    completedTaskCount,
    completionPercent,
  };
}

export function createGoalProjectsPath(goalId: string): string {
  return `/projects?${new URLSearchParams({ goalId }).toString()}`;
}
