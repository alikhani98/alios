import { describe, expect, it } from "vitest";

import {
  goalRecord,
  knowledgeItemRecord,
  projectRecord,
  resourceRecord,
  taskRecord,
} from "@/test/factories";
import { resolveGoalLearningContext } from "../learningContext";

describe("goal learning context", () => {
  it("resolves related records, preserves provenance, and calculates separate signals", () => {
    const goal = { ...goalRecord, id: "goal-1", progressPercent: 35 };
    const project = {
      ...projectRecord,
      id: "project-1",
      goalId: goal.id,
      status: "completed" as const,
    };
    const task = {
      ...taskRecord,
      id: "task-1",
      projectId: project.id,
      status: "done" as const,
    };
    const directResource = {
      ...resourceRecord,
      id: "resource-direct",
      goalId: goal.id,
      progressPercent: 40,
    };
    const projectResource = {
      ...resourceRecord,
      id: "resource-project",
      projectId: project.id,
      progressPercent: 60,
    };
    const knowledgeResource = {
      ...resourceRecord,
      id: "resource-knowledge",
      progressPercent: undefined,
    };
    const knowledgeItem = {
      ...knowledgeItemRecord,
      id: "knowledge-1",
      goalId: goal.id,
      resourceId: knowledgeResource.id,
    };

    const context = resolveGoalLearningContext({
      goal,
      resources: [directResource, projectResource, knowledgeResource],
      projects: [project],
      tasks: [task],
      knowledgeItems: [knowledgeItem],
    });

    expect(context.relatedResources).toEqual([
      {
        id: directResource.id,
        title: directResource.title,
        provenance: "direct",
      },
      {
        id: projectResource.id,
        title: projectResource.title,
        provenance: "project",
      },
      {
        id: knowledgeResource.id,
        title: knowledgeResource.title,
        provenance: "knowledge",
      },
    ]);
    expect(context.relatedProjects[0]).toMatchObject({
      id: project.id,
      provenance: "direct",
    });
    expect(context.relatedTasks[0]).toMatchObject({
      id: task.id,
      provenance: "project",
    });
    expect(context.relatedKnowledge[0]).toMatchObject({
      id: knowledgeItem.id,
      provenance: "direct",
    });
    expect(context.progressSignals).toEqual({
      goalProgress: 35,
      projectCompletion: { completed: 1, total: 1, percent: 100 },
      taskCompletion: { completed: 1, total: 1, percent: 100 },
      resourceProgress: { tracked: 2, total: 3, averagePercent: 50 },
      knowledgeCount: 1,
    });
  });

  it("deduplicates a record using direct provenance over indirect paths", () => {
    const goal = { ...goalRecord, id: "goal-1" };
    const project = { ...projectRecord, id: "project-1", goalId: goal.id };
    const resource = {
      ...resourceRecord,
      id: "resource-1",
      goalId: goal.id,
      projectId: project.id,
    };
    const knowledgeItem = {
      ...knowledgeItemRecord,
      goalId: goal.id,
      resourceId: resource.id,
    };

    const context = resolveGoalLearningContext({
      goal,
      resources: [resource],
      projects: [project],
      tasks: [],
      knowledgeItems: [knowledgeItem],
    });

    expect(context.relatedResources).toEqual([
      { id: resource.id, title: resource.title, provenance: "direct" },
    ]);
  });

  it("keeps missing Knowledge references available as unavailable projections", () => {
    const goal = { ...goalRecord, id: "goal-1" };
    const context = resolveGoalLearningContext({
      goal,
      resources: [],
      projects: [],
      tasks: [],
      knowledgeItems: [
        {
          ...knowledgeItemRecord,
          goalId: goal.id,
          resourceId: "deleted-resource",
          projectId: "deleted-project",
          taskId: "deleted-task",
        },
      ],
    });

    expect(context.relatedResources).toEqual([
      { id: "deleted-resource", provenance: "knowledge" },
    ]);
    expect(context.relatedProjects).toEqual([
      { id: "deleted-project", provenance: "knowledge" },
    ]);
    expect(context.relatedTasks).toEqual([
      { id: "deleted-task", provenance: "knowledge" },
    ]);
    expect(context.progressSignals.knowledgeCount).toBe(1);
  });
});
