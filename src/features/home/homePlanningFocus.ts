import type { Goal, Project, Task } from "@/shared/types";

export type HomePlanningFocus = {
  goal: Goal;
  project?: Project;
  task?: Task;
};

const importanceScore: Record<Goal["importance"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function isOpenTask(task: Task): boolean {
  return task.status !== "done" && task.status !== "cancelled";
}

function isGoalReviewDue(goal: Goal, referenceDate: Date): boolean {
  if (goal.status !== "active" || !goal.reviewIntervalDays) {
    return false;
  }

  const reviewBase = Date.parse(goal.lastReviewedAt ?? goal.updatedAt);
  if (Number.isNaN(reviewBase)) {
    return false;
  }

  const endOfReferenceDay = new Date(referenceDate);
  endOfReferenceDay.setHours(23, 59, 59, 999);
  return reviewBase + goal.reviewIntervalDays * 86_400_000 <= endOfReferenceDay.getTime();
}

function projectNeedsAttention(project: Project, referenceDate: Date): boolean {
  if (project.status !== "active") {
    return false;
  }

  if (!project.nextAction?.trim()) {
    return true;
  }

  return Boolean(project.reviewDate && project.reviewDate <= referenceDate.toISOString().slice(0, 10));
}

export function getHomePlanningFocus(
  goals: ReadonlyArray<Goal>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>,
  referenceDate = new Date()
): HomePlanningFocus | undefined {
  const activeGoals = goals
    .filter((goal) => goal.status === "active")
    .sort((left, right) => {
      const reviewDifference = Number(isGoalReviewDue(right, referenceDate)) - Number(isGoalReviewDue(left, referenceDate));
      if (reviewDifference !== 0) {
        return reviewDifference;
      }

      const importanceDifference = importanceScore[right.importance] - importanceScore[left.importance];
      return importanceDifference !== 0
        ? importanceDifference
        : right.updatedAt.localeCompare(left.updatedAt);
    });
  const goal = activeGoals[0];

  if (!goal) {
    return undefined;
  }

  const linkedProjects = projects
    .filter((project) => project.goalId === goal.id && project.status === "active")
    .sort((left, right) => {
      const attentionDifference = Number(projectNeedsAttention(right, referenceDate)) - Number(projectNeedsAttention(left, referenceDate));
      return attentionDifference !== 0
        ? attentionDifference
        : right.updatedAt.localeCompare(left.updatedAt);
    });
  const project = linkedProjects[0];
  const task = project
    ? tasks
        .filter((entry) => entry.projectId === project.id && isOpenTask(entry))
        .sort((left, right) => {
          const mitDifference = Number(right.isMit) - Number(left.isMit);
          return mitDifference !== 0
            ? mitDifference
            : right.updatedAt.localeCompare(left.updatedAt);
        })[0]
    : undefined;

  return { goal, project, task };
}
