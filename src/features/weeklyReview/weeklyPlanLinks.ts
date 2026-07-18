import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";
import { createLinkedGoalPath } from "@/features/projects/projectGoalLinks";

export type WeeklyPlanLinkKind = "goal" | "project" | "task";

export type WeeklyPlanLink = {
  kind: WeeklyPlanLinkKind;
  id: string;
  title?: string;
  to?: string;
};

export function createWeeklyPlanTaskPath(taskId: string): string {
  return `/today?${new URLSearchParams({ focusId: taskId }).toString()}`;
}

export function getWeeklyPlanLinks(
  plan: WeeklyPlan | undefined,
  goals: ReadonlyArray<Goal>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): WeeklyPlanLink[] {
  if (!plan) {
    return [];
  }

  const links: WeeklyPlanLink[] = [];
  if (plan.goalId) {
    const goal = goals.find((entry) => entry.id === plan.goalId);
    links.push({ kind: "goal", id: plan.goalId, title: goal?.title, to: goal ? createLinkedGoalPath(goal.id) : undefined });
  }
  if (plan.projectId) {
    const project = projects.find((entry) => entry.id === plan.projectId);
    links.push({ kind: "project", id: plan.projectId, title: project?.title, to: project ? `/projects?${new URLSearchParams({ focusId: project.id }).toString()}` : undefined });
  }
  if (plan.taskId) {
    const task = tasks.find((entry) => entry.id === plan.taskId);
    links.push({ kind: "task", id: plan.taskId, title: task?.title, to: task ? createWeeklyPlanTaskPath(task.id) : undefined });
  }

  return links;
}
