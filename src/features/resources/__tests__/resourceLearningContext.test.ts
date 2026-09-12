import { describe, expect, it } from "vitest";

import {
  goalRecord,
  knowledgeItemRecord,
  projectRecord,
  resourceRecord,
  taskRecord,
} from "@/test/factories";
import { resolveResourceLearningContext } from "../resourceLearningContext";

describe("resolveResourceLearningContext", () => {
  it("resolves direct and derived resource learning relationships with provenance", () => {
    const directGoal = {
      ...goalRecord,
      id: "goal-direct",
      title: "Build reading habit",
    };
    const knowledgeGoal = {
      ...goalRecord,
      id: "goal-knowledge",
      title: "Improve learning habit",
    };
    const directProject = {
      ...projectRecord,
      id: "project-direct",
      title: "Personal growth",
      goalId: directGoal.id,
    };
    const directTask = {
      ...taskRecord,
      id: "task-direct",
      title: "Read chapter one",
      projectId: directProject.id,
    };
    const projectTask = {
      ...taskRecord,
      id: "task-project",
      title: "Summarize notes",
      projectId: directProject.id,
    };
    const resource = {
      ...resourceRecord,
      goalId: directGoal.id,
      projectId: directProject.id,
      taskId: directTask.id,
    };

    const context = resolveResourceLearningContext({
      resource,
      goals: [directGoal, knowledgeGoal],
      projects: [directProject],
      tasks: [directTask, projectTask],
      knowledgeItems: [
        {
          ...knowledgeItemRecord,
          id: "knowledge-1",
          title: "Habit cue note",
          resourceId: resource.id,
          goalId: knowledgeGoal.id,
          projectId: directProject.id,
          taskId: directTask.id,
        },
      ],
    });

    expect(context.relatedGoals).toEqual([
      { id: directGoal.id, title: directGoal.title, provenance: "direct" },
      {
        id: knowledgeGoal.id,
        title: knowledgeGoal.title,
        provenance: "knowledge",
      },
    ]);
    expect(context.relatedProjects).toEqual([
      {
        id: directProject.id,
        title: directProject.title,
        provenance: "direct",
      },
    ]);
    expect(context.relatedTasks).toEqual([
      { id: directTask.id, title: directTask.title, provenance: "direct" },
      {
        id: projectTask.id,
        title: projectTask.title,
        provenance: "project",
      },
    ]);
    expect(context.relatedKnowledge).toEqual([
      {
        id: "knowledge-1",
        title: "Habit cue note",
        provenance: "direct",
      },
    ]);
  });

  it("keeps missing references visible without crashing", () => {
    const context = resolveResourceLearningContext({
      resource: {
        ...resourceRecord,
        goalId: "missing-goal",
        projectId: "missing-project",
        taskId: "missing-task",
      },
      goals: [],
      projects: [],
      tasks: [],
      knowledgeItems: [
        {
          ...knowledgeItemRecord,
          id: "knowledge-1",
          resourceId: resourceRecord.id,
          goalId: "missing-knowledge-goal",
        },
      ],
    });

    expect(context.relatedGoals).toEqual([
      { id: "missing-goal", provenance: "direct" },
      { id: "missing-knowledge-goal", provenance: "knowledge" },
    ]);
    expect(context.relatedProjects).toEqual([
      { id: "missing-project", provenance: "direct" },
    ]);
    expect(context.relatedTasks).toEqual([
      { id: "missing-task", provenance: "direct" },
    ]);
  });
});
