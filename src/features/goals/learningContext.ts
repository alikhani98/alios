import type { Goal, KnowledgeItem, Project, Resource, Task } from "@/shared/types";

export type LearningContextProvenance =
  | "direct"
  | "project"
  | "task"
  | "knowledge";

export type LearningContextRelation = {
  id: string;
  title?: string;
  provenance: LearningContextProvenance;
};

export type LearningContextProgressSignals = {
  goalProgress: number;
  projectCompletion: {
    completed: number;
    total: number;
    percent: number | null;
  };
  taskCompletion: {
    completed: number;
    total: number;
    percent: number | null;
  };
  resourceProgress: {
    tracked: number;
    total: number;
    averagePercent: number | null;
  };
  knowledgeCount: number;
};

export type GoalLearningContext = {
  relatedResources: LearningContextRelation[];
  relatedProjects: LearningContextRelation[];
  relatedTasks: LearningContextRelation[];
  relatedKnowledge: LearningContextRelation[];
  progressSignals: LearningContextProgressSignals;
};

const provenanceRank: Record<LearningContextProvenance, number> = {
  knowledge: 1,
  task: 2,
  project: 3,
  direct: 4,
};

function addRelation(
  relations: LearningContextRelation[],
  record: { id: string; title?: string },
  provenance: LearningContextProvenance
) {
  const existing = relations.find((relation) => relation.id === record.id);
  if (!existing) {
    relations.push({ id: record.id, title: record.title, provenance });
    return;
  }

  if (provenanceRank[provenance] > provenanceRank[existing.provenance]) {
    existing.provenance = provenance;
  }
  if (!existing.title && record.title) {
    existing.title = record.title;
  }
}

function completionSignal(completed: number, total: number) {
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : null,
  };
}

export function resolveGoalLearningContext({
  goal,
  resources,
  projects,
  tasks,
  knowledgeItems,
}: {
  goal: Goal;
  resources: ReadonlyArray<Resource>;
  projects: ReadonlyArray<Project>;
  tasks: ReadonlyArray<Task>;
  knowledgeItems: ReadonlyArray<KnowledgeItem>;
}): GoalLearningContext {
  const relatedResources: LearningContextRelation[] = [];
  const relatedProjects: LearningContextRelation[] = [];
  const relatedTasks: LearningContextRelation[] = [];
  const relatedKnowledge: LearningContextRelation[] = [];
  const goalProjects = projects.filter((project) => project.goalId === goal.id);
  const projectIds = new Set(goalProjects.map((project) => project.id));
  const goalTasks = tasks.filter(
    (task) => task.projectId && projectIds.has(task.projectId)
  );
  const taskIds = new Set(goalTasks.map((task) => task.id));

  goalProjects.forEach((project) => addRelation(relatedProjects, project, "direct"));
  goalTasks.forEach((task) => addRelation(relatedTasks, task, "project"));

  for (const resource of resources) {
    if (resource.goalId === goal.id) {
      addRelation(relatedResources, resource, "direct");
    } else if (resource.projectId && projectIds.has(resource.projectId)) {
      addRelation(relatedResources, resource, "project");
    } else if (resource.taskId && taskIds.has(resource.taskId)) {
      addRelation(relatedResources, resource, "task");
    }
  }

  for (const item of knowledgeItems) {
    const itemProjectIsRelated = Boolean(item.projectId && projectIds.has(item.projectId));
    const itemTaskIsRelated = Boolean(item.taskId && taskIds.has(item.taskId));
    const itemResource = item.resourceId
      ? resources.find((resource) => resource.id === item.resourceId)
      : undefined;
    const itemResourceIsRelated = itemResource
      ? relatedResources.some((relation) => relation.id === itemResource.id)
      : false;

    if (
      item.goalId === goal.id ||
      itemProjectIsRelated ||
      itemTaskIsRelated ||
      itemResourceIsRelated
    ) {
      const provenance: LearningContextProvenance =
        item.goalId === goal.id
          ? "direct"
          : itemProjectIsRelated
            ? "project"
            : itemTaskIsRelated
              ? "task"
              : "knowledge";
      addRelation(relatedKnowledge, item, provenance);
    }

    if (item.resourceId && (item.goalId === goal.id || itemProjectIsRelated || itemTaskIsRelated)) {
      addRelation(
        relatedResources,
        itemResource ?? { id: item.resourceId },
        "knowledge"
      );
    }
    if (item.projectId && item.goalId === goal.id) {
      addRelation(
        relatedProjects,
        projects.find((project) => project.id === item.projectId) ?? {
          id: item.projectId,
        },
        "knowledge"
      );
    }
    if (item.taskId && (item.goalId === goal.id || itemProjectIsRelated)) {
      addRelation(
        relatedTasks,
        tasks.find((task) => task.id === item.taskId) ?? { id: item.taskId },
        "knowledge"
      );
    }
  }

  const existingResources = relatedResources
    .map((relation) => resources.find((resource) => resource.id === relation.id))
    .filter((resource): resource is Resource => Boolean(resource));
  const trackedResources = existingResources.filter(
    (resource) => resource.progressPercent !== undefined
  );
  const resourceProgressTotal = trackedResources.reduce(
    (total, resource) => total + (resource.progressPercent ?? 0),
    0
  );

  return {
    relatedResources,
    relatedProjects,
    relatedTasks,
    relatedKnowledge,
    progressSignals: {
      goalProgress: goal.progressPercent,
      projectCompletion: completionSignal(
        goalProjects.filter((project) => project.status === "completed").length,
        goalProjects.length
      ),
      taskCompletion: completionSignal(
        goalTasks.filter((task) => task.status === "done").length,
        goalTasks.length
      ),
      resourceProgress: {
        tracked: trackedResources.length,
        total: existingResources.length,
        averagePercent:
          trackedResources.length > 0
            ? Math.round(resourceProgressTotal / trackedResources.length)
            : null,
      },
      knowledgeCount: relatedKnowledge.length,
    },
  };
}
