import type { Goal, KnowledgeItem, Project, Resource, Task } from "@/shared/types";

export type ResourceRelationshipProvenance =
  | "direct"
  | "knowledge"
  | "project"
  | "task";

export type ResourceRelationship = {
  id: string;
  title: string;
  provenance: ResourceRelationshipProvenance;
};

export type ResourceRelationshipContext = {
  directGoal?: Goal;
  directProject?: Project;
  directTask?: Task;
  derivedGoals: ResourceRelationship[];
  derivedProjects: ResourceRelationship[];
  derivedTasks: ResourceRelationship[];
};

function addRelationship(
  relationships: ResourceRelationship[],
  record: { id: string; title: string },
  provenance: ResourceRelationshipProvenance
) {
  if (!relationships.some((item) => item.id === record.id)) {
    relationships.push({ id: record.id, title: record.title, provenance });
  }
}

export function deriveResourceRelationshipContext(
  resource: Resource,
  knowledgeItems: ReadonlyArray<KnowledgeItem>,
  goals: ReadonlyArray<Goal>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): ResourceRelationshipContext {
  const directGoal = resource.goalId
    ? goals.find((goal) => goal.id === resource.goalId)
    : undefined;
  const directProject = resource.projectId
    ? projects.find((project) => project.id === resource.projectId)
    : undefined;
  const directTask = resource.taskId
    ? tasks.find((task) => task.id === resource.taskId)
    : undefined;
  const derivedGoals: ResourceRelationship[] = [];
  const derivedProjects: ResourceRelationship[] = [];
  const derivedTasks: ResourceRelationship[] = [];
  const linkedKnowledge = knowledgeItems.filter(
    (item) => item.resourceId === resource.id
  );

  for (const item of linkedKnowledge) {
    const goal = item.goalId
      ? goals.find((entry) => entry.id === item.goalId)
      : undefined;
    const project = item.projectId
      ? projects.find((entry) => entry.id === item.projectId)
      : undefined;
    const task = item.taskId
      ? tasks.find((entry) => entry.id === item.taskId)
      : undefined;

    if (goal) addRelationship(derivedGoals, goal, "knowledge");
    if (project) addRelationship(derivedProjects, project, "knowledge");
    if (task) addRelationship(derivedTasks, task, "knowledge");
  }

  if (directProject) {
    const goal = directProject.goalId
      ? goals.find((entry) => entry.id === directProject.goalId)
      : undefined;
    if (goal) addRelationship(derivedGoals, goal, "project");

    for (const task of tasks.filter(
      (entry) => entry.projectId === directProject.id
    )) {
      addRelationship(derivedTasks, task, "project");
    }
  }

  if (directTask) {
    const project = directTask.projectId
      ? projects.find((entry) => entry.id === directTask.projectId)
      : undefined;
    if (project) {
      addRelationship(derivedProjects, project, "task");
      const goal = project.goalId
        ? goals.find((entry) => entry.id === project.goalId)
        : undefined;
      if (goal) addRelationship(derivedGoals, goal, "task");
    }
  }

  const directIds = new Set(
    [directGoal?.id, directProject?.id, directTask?.id].filter(
      (id): id is string => Boolean(id)
    )
  );

  return {
    directGoal,
    directProject,
    directTask,
    derivedGoals: derivedGoals.filter((item) => !directIds.has(item.id)),
    derivedProjects: derivedProjects.filter((item) => !directIds.has(item.id)),
    derivedTasks: derivedTasks.filter((item) => !directIds.has(item.id)),
  };
}

export function deriveResourcesForGoal(
  goalId: string,
  resources: ReadonlyArray<Resource>,
  knowledgeItems: ReadonlyArray<KnowledgeItem>,
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>
): ResourceRelationship[] {
  const projectIds = new Set(
    projects
      .filter((project) => project.goalId === goalId)
      .map((project) => project.id)
  );
  const taskIds = new Set(
    tasks
      .filter((task) => task.projectId && projectIds.has(task.projectId))
      .map((task) => task.id)
  );
  const result: ResourceRelationship[] = [];

  for (const resource of resources) {
    if (resource.goalId === goalId) {
      addRelationship(result, resource, "direct");
      continue;
    }
    if (
      resource.projectId &&
      projectIds.has(resource.projectId)
    ) {
      addRelationship(result, resource, "project");
      continue;
    }
    if (resource.taskId && taskIds.has(resource.taskId)) {
      addRelationship(result, resource, "task");
      continue;
    }
    if (
      knowledgeItems.some(
        (item) =>
          item.resourceId === resource.id && item.goalId === goalId
      )
    ) {
      addRelationship(result, resource, "knowledge");
    }
  }

  return result;
}

export function deriveResourcesForProject(
  projectId: string,
  resources: ReadonlyArray<Resource>,
  knowledgeItems: ReadonlyArray<KnowledgeItem>,
  tasks: ReadonlyArray<Task>
): ResourceRelationship[] {
  const taskIds = new Set(
    tasks
      .filter((task) => task.projectId === projectId)
      .map((task) => task.id)
  );
  const result: ResourceRelationship[] = [];

  for (const resource of resources) {
    if (resource.projectId === projectId) {
      addRelationship(result, resource, "direct");
      continue;
    }
    if (resource.taskId && taskIds.has(resource.taskId)) {
      addRelationship(result, resource, "task");
      continue;
    }
    if (
      knowledgeItems.some(
        (item) =>
          item.resourceId === resource.id && item.projectId === projectId
      )
    ) {
      addRelationship(result, resource, "knowledge");
    }
  }

  return result;
}
