import type { Task } from "@/shared/types";

export type RoutineTaskProgress = {
  total: number;
  completed: number;
  open: number;
  completionPercent: number;
};

export function getRoutineTaskProgress(
  routineId: string,
  tasks: ReadonlyArray<Task>
): RoutineTaskProgress {
  const linkedTasks = tasks.filter((task) => task.routineId === routineId);
  const completed = linkedTasks.filter((task) => task.status === "done").length;

  return {
    total: linkedTasks.length,
    completed,
    open: linkedTasks.filter(
      (task) => task.status !== "done" && task.status !== "cancelled"
    ).length,
    completionPercent:
      linkedTasks.length === 0
        ? 0
        : Math.round((completed / linkedTasks.length) * 100),
  };
}
