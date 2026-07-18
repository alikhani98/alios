import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";

export type TodayWeeklyPlanFocus = {
  plan?: WeeklyPlan;
  goal?: Goal;
  project?: Project;
  task?: Task;
  linkedTaskTotal: number;
  linkedTaskCompleted: number;
};

export function getTodayWeekStart(referenceDate = new Date()): string {
  const date = new Date(referenceDate);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayWeeklyPlanFocus(
  plan: WeeklyPlan | undefined,
  goals: ReadonlyArray<Goal>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): TodayWeeklyPlanFocus {
  if (!plan) {
    return { linkedTaskTotal: 0, linkedTaskCompleted: 0 };
  }

  const goal = plan.goalId ? goals.find((entry) => entry.id === plan.goalId) : undefined;
  const project = plan.projectId ? projects.find((entry) => entry.id === plan.projectId) : undefined;
  const task = plan.taskId ? tasks.find((entry) => entry.id === plan.taskId) : undefined;
  const projectIds = new Set(
    project
      ? [project.id]
      : goal
        ? projects.filter((entry) => entry.goalId === goal.id).map((entry) => entry.id)
        : []
  );
  const linkedTasks = tasks.filter(
    (entry) => projectIds.has(entry.projectId ?? "") || entry.id === task?.id
  );

  return {
    plan,
    goal,
    project,
    task,
    linkedTaskTotal: linkedTasks.length,
    linkedTaskCompleted: linkedTasks.filter((entry) => entry.status === "done").length,
  };
}
