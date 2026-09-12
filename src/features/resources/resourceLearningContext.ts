import type { Goal, KnowledgeItem, Project, Resource, Task } from "@/shared/types";

export type ResourceLearningProvenance =
  | "direct"
  | "project"
  | "task"
  | "knowledge";

export type ResourceLearningRelationship = {
  id: string;
  title?: string;
  provenance: ResourceLearningProvenance;
};

export type ResourceLearningContext = {
  relatedGoals: ResourceLearningRelationship[];
  relatedProjects: ResourceLearningRelationship[];
  relatedTasks: ResourceLearningRelationship[];
  relatedKnowledge: ResourceLearningRelationship[];
};

const provenanceRank: Record<ResourceLearningProvenance, number> = {
  knowledge: 1,
  task: 2,
  project: 3,
  direct: 4,
};

function addRelationship(
  relationships: ResourceLearningRelationship[],
  record: { id: string; title?: string },
  provenance: ResourceLearningProvenance
) {
  const existing = relationships.find((item) => item.id === record.id);
  if (!existing) {
    relationships.push({ id: record.id, title: record.title, provenance });
    return;
  }

  if (provenanceRank[provenance] > provenanceRank[existing.provenance]) {
    existing.provenance = provenance;
  }
  if (!existing.title && record.title) {
    existing.title = record.title;
  }
}

export function resolveResourceLearningContext({
  resource,
  goals,
  projects,
  tasks,
  knowledgeItems,
}: {
  resource: Resource;
  goals: ReadonlyArray<Goal>;
  projects: ReadonlyArray<Project>;
  tasks: ReadonlyArray<Task>;
  knowledgeItems: ReadonlyArray<KnowledgeItem>;
}): ResourceLearningContext {
  const relatedGoals: ResourceLearningRelationship[] = [];
  const relatedProjects: ResourceLearningRelationship[] = [];
  const relatedTasks: ResourceLearningRelationship[] = [];
  const relatedKnowledge: ResourceLearningRelationship[] = [];
  const directGoal = resource.goalId
    ? goals.find((goal) => goal.id === resource.goalId)
    : undefined;
  const directProject = resource.projectId
    ? projects.find((project) => project.id === resource.projectId)
    : undefined;
  const directTask = resource.taskId
    ? tasks.find((task) => task.id === resource.taskId)
    : undefined;

  if (resource.goalId) {
    addRelationship(
      relatedGoals,
      directGoal ?? { id: resource.goalId },
      "direct"
    );
  }
  if (resource.projectId) {
    addRelationship(
      relatedProjects,
      directProject ?? { id: resource.projectId },
      "direct"
    );
  }
  if (resource.taskId) {
    addRelationship(
      relatedTasks,
      directTask ?? { id: resource.taskId },
      "direct"
    );
  }

  if (directProject) {
    if (directProject.goalId) {
      addRelationship(
        relatedGoals,
        goals.find((goal) => goal.id === directProject.goalId) ?? {
          id: directProject.goalId,
        },
        "project"
      );
    }
    tasks
      .filter((task) => task.projectId === directProject.id)
      .forEach((task) => addRelationship(relatedTasks, task, "project"));
  }

  if (directTask?.projectId) {
    const taskProject = projects.find(
      (project) => project.id === directTask.projectId
    );
    addRelationship(
      relatedProjects,
      taskProject ?? { id: directTask.projectId },
      "task"
    );
    if (taskProject?.goalId) {
      addRelationship(
        relatedGoals,
        goals.find((goal) => goal.id === taskProject.goalId) ?? {
          id: taskProject.goalId,
        },
        "task"
      );
    }
  }

  knowledgeItems
    .filter((item) => item.resourceId === resource.id)
    .forEach((item) => {
      addRelationship(relatedKnowledge, item, "direct");

      if (item.goalId) {
        addRelationship(
          relatedGoals,
          goals.find((goal) => goal.id === item.goalId) ?? { id: item.goalId },
          "knowledge"
        );
      }
      if (item.projectId) {
        addRelationship(
          relatedProjects,
          projects.find((project) => project.id === item.projectId) ?? {
            id: item.projectId,
          },
          "knowledge"
        );
      }
      if (item.taskId) {
        addRelationship(
          relatedTasks,
          tasks.find((task) => task.id === item.taskId) ?? { id: item.taskId },
          "knowledge"
        );
      }
    });

  return {
    relatedGoals,
    relatedProjects,
    relatedTasks,
    relatedKnowledge,
  };
}
