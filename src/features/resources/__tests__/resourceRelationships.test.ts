import { describe, expect, it } from "vitest";

import {
  deriveResourceRelationshipContext,
  deriveResourcesForGoal,
  deriveResourcesForProject,
} from "../resourceRelationships";
import {
  goalRecord,
  knowledgeItemRecord,
  projectRecord,
  resourceRecord,
  taskRecord,
} from "@/test/factories";

describe("resource relationships", () => {
  it("resolves direct and derived context with provenance", () => {
    const resource = {
      ...resourceRecord,
      id: "resource-1",
      goalId: "goal-direct",
      projectId: "project-direct",
      taskId: "task-direct",
    };
    const directGoal = { ...goalRecord, id: "goal-direct", title: "Direct goal" };
    const directProject = {
      ...projectRecord,
      id: "project-direct",
      title: "Direct project",
      goalId: directGoal.id,
    };
    const directTask = {
      ...taskRecord,
      id: "task-direct",
      title: "Direct task",
      projectId: directProject.id,
    };
    const knowledgeGoal = { ...goalRecord, id: "goal-from-knowledge", title: "Knowledge goal" };
    const knowledgeTask = {
      ...taskRecord,
      id: "task-from-knowledge",
      title: "Knowledge task",
      projectId: directProject.id,
    };

    const context = deriveResourceRelationshipContext(
      resource,
      [
        {
          ...knowledgeItemRecord,
          id: "knowledge-1",
          resourceId: resource.id,
          goalId: knowledgeGoal.id,
          taskId: knowledgeTask.id,
        },
      ],
      [directGoal, knowledgeGoal],
      [directProject],
      [directTask, knowledgeTask]
    );

    expect(context.directGoal?.title).toBe("Direct goal");
    expect(context.directProject?.title).toBe("Direct project");
    expect(context.directTask?.title).toBe("Direct task");
    expect(context.derivedGoals).toEqual([
      { id: knowledgeGoal.id, title: knowledgeGoal.title, provenance: "knowledge" },
    ]);
    expect(context.derivedTasks).toEqual([
      { id: knowledgeTask.id, title: knowledgeTask.title, provenance: "knowledge" },
    ]);
  });

  it("derives resources for goal and project without reverse persistence", () => {
    const goal = { ...goalRecord, id: "goal-1" };
    const project = { ...projectRecord, id: "project-1", goalId: goal.id };
    const task = { ...taskRecord, id: "task-1", projectId: project.id };
    const directResource = { ...resourceRecord, id: "resource-direct", goalId: goal.id };
    const projectResource = { ...resourceRecord, id: "resource-project", projectId: project.id };
    const taskResource = { ...resourceRecord, id: "resource-task", taskId: task.id };
    const knowledgeResource = { ...resourceRecord, id: "resource-knowledge" };
    const knowledgeItem = {
      ...knowledgeItemRecord,
      resourceId: knowledgeResource.id,
      goalId: goal.id,
      projectId: project.id,
    };

    expect(
      deriveResourcesForGoal(
        goal.id,
        [directResource, projectResource, taskResource, knowledgeResource],
        [knowledgeItem],
        [project],
        [task]
      )
    ).toEqual([
      { id: directResource.id, title: directResource.title, provenance: "direct" },
      { id: projectResource.id, title: projectResource.title, provenance: "project" },
      { id: taskResource.id, title: taskResource.title, provenance: "task" },
      { id: knowledgeResource.id, title: knowledgeResource.title, provenance: "knowledge" },
    ]);

    expect(
      deriveResourcesForProject(
        project.id,
        [directResource, projectResource, taskResource, knowledgeResource],
        [knowledgeItem],
        [task]
      )
    ).toEqual([
      { id: projectResource.id, title: projectResource.title, provenance: "direct" },
      { id: taskResource.id, title: taskResource.title, provenance: "task" },
      { id: knowledgeResource.id, title: knowledgeResource.title, provenance: "knowledge" },
    ]);
  });

  it("ignores missing related entities without throwing", () => {
    const context = deriveResourceRelationshipContext(
      {
        ...resourceRecord,
        goalId: "missing-goal",
        projectId: "missing-project",
        taskId: "missing-task",
      },
      [],
      [],
      [],
      []
    );

    expect(context.directGoal).toBeUndefined();
    expect(context.directProject).toBeUndefined();
    expect(context.directTask).toBeUndefined();
    expect(context.derivedGoals).toEqual([]);
    expect(context.derivedProjects).toEqual([]);
    expect(context.derivedTasks).toEqual([]);
  });
});
