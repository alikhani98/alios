import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";

export type WeeklyPlanExecutionState = "empty" | "active" | "completed";

export type WeeklyPlanExecution = {
  state: WeeklyPlanExecutionState;
  total: number;
  completed: number;
  open: number;
};

export function getWeeklyPlanExecution(
  plan: WeeklyPlan | undefined,
  goals: ReadonlyArray<Goal>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): WeeklyPlanExecution {
  if (!plan) {
    return { state: "empty", total: 0, completed: 0, open: 0 };
  }

  const linkedGoal = plan.goalId ? goals.find((entry) => entry.id === plan.goalId) : undefined;
  const linkedProject = plan.projectId ? projects.find((entry) => entry.id === plan.projectId) : undefined;
  const projectIds = new Set(
    linkedProject
      ? [linkedProject.id]
      : linkedGoal
        ? projects.filter((entry) => entry.goalId === linkedGoal.id).map((entry) => entry.id)
        : []
  );
  const linkedTasks = tasks.filter(
    (entry) => projectIds.has(entry.projectId ?? "") || entry.id === plan.taskId
  );
  const completed = linkedTasks.filter((entry) => entry.status === "done").length;
  const total = linkedTasks.length;

  return {
    state: total === 0 ? "empty" : completed === total ? "completed" : "active",
    total,
    completed,
    open: total - completed,
  };
}
