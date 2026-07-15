import type { Goal, Project } from "@/shared/types";

export function createLinkedGoalPath(goalId: string): string {
  const searchParams = new URLSearchParams({ focusId: goalId });
  return `/goals?${searchParams.toString()}`;
}

export function findLinkedGoal(
  project: Pick<Project, "goalId">,
  goals: ReadonlyArray<Goal>
): Goal | undefined {
  if (!project.goalId) {
    return undefined;
  }

  return goals.find((goal) => goal.id === project.goalId);
}
