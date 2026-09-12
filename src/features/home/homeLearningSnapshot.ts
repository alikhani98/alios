import type { Goal, KnowledgeItem, Resource } from "@/shared/types";

export type HomeLearningSnapshot = {
  activeLearningGoals: Goal[];
  inProgressResources: Resource[];
  recentKnowledgeItems: KnowledgeItem[];
  continueLearningResource?: Resource;
  hasAnyData: boolean;
};

function byUpdatedAtDescending<T extends { updatedAt: string }>(
  left: T,
  right: T
) {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function isLearningKnowledgeItem(item: KnowledgeItem) {
  return Boolean(item.goalId || item.projectId || item.taskId || item.resourceId);
}

export function buildHomeLearningSnapshot({
  goals,
  resources,
  knowledgeItems,
}: {
  goals: ReadonlyArray<Goal>;
  resources: ReadonlyArray<Resource>;
  knowledgeItems: ReadonlyArray<KnowledgeItem>;
}): HomeLearningSnapshot {
  const activeLearningGoals = goals
    .filter((goal) => goal.status === "active")
    .sort(byUpdatedAtDescending)
    .slice(0, 3);
  const inProgressResources = resources
    .filter((resource) => resource.status === "in_progress")
    .sort(byUpdatedAtDescending)
    .slice(0, 3);
  const recentResources = resources
    .filter((resource) => resource.status !== "archived")
    .sort(byUpdatedAtDescending);
  const learningKnowledgeItems = knowledgeItems.filter(isLearningKnowledgeItem);
  const recentKnowledgeItems = [
    ...(learningKnowledgeItems.length > 0
      ? learningKnowledgeItems
      : knowledgeItems),
  ]
    .sort(byUpdatedAtDescending)
    .slice(0, 3);
  const continueLearningResource =
    inProgressResources[0] ?? recentResources[0];

  return {
    activeLearningGoals,
    inProgressResources,
    recentKnowledgeItems,
    continueLearningResource,
    hasAnyData:
      activeLearningGoals.length > 0 ||
      resources.length > 0 ||
      knowledgeItems.length > 0,
  };
}
