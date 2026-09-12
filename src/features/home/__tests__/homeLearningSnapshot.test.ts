import { describe, expect, it } from "vitest";

import {
  goalRecord,
  knowledgeItemRecord,
  resourceRecord,
} from "@/test/factories";
import type { Goal, Resource } from "@/shared/types";
import { buildHomeLearningSnapshot } from "../homeLearningSnapshot";

describe("buildHomeLearningSnapshot", () => {
  it("derives active goals, in-progress resources, recent knowledge, and continue learning", () => {
    const activeGoal: Goal = {
      ...goalRecord,
      id: "goal-active",
      title: "Become data analyst",
      status: "active",
      updatedAt: "2026-08-04T08:00:00.000Z",
    };
    const completedGoal: Goal = {
      ...goalRecord,
      id: "goal-completed",
      status: "completed",
      updatedAt: "2026-08-08T08:00:00.000Z",
    };
    const inProgressResource: Resource = {
      ...resourceRecord,
      id: "resource-progress",
      title: "SQL Course",
      status: "in_progress",
      updatedAt: "2026-08-07T08:00:00.000Z",
    };
    const recentResource: Resource = {
      ...resourceRecord,
      id: "resource-recent",
      title: "Python Book",
      status: "unread",
      updatedAt: "2026-08-09T08:00:00.000Z",
    };
    const linkedKnowledge = {
      ...knowledgeItemRecord,
      id: "knowledge-linked",
      title: "Join strategy note",
      resourceId: inProgressResource.id,
      updatedAt: "2026-08-10T08:00:00.000Z",
    };
    const unlinkedKnowledge = {
      ...knowledgeItemRecord,
      id: "knowledge-unlinked",
      title: "General note",
      resourceId: undefined,
      updatedAt: "2026-08-11T08:00:00.000Z",
    };

    const snapshot = buildHomeLearningSnapshot({
      goals: [completedGoal, activeGoal],
      resources: [recentResource, inProgressResource],
      knowledgeItems: [unlinkedKnowledge, linkedKnowledge],
    });

    expect(snapshot.activeLearningGoals).toEqual([activeGoal]);
    expect(snapshot.inProgressResources).toEqual([inProgressResource]);
    expect(snapshot.continueLearningResource).toBe(inProgressResource);
    expect(snapshot.recentKnowledgeItems).toEqual([linkedKnowledge]);
    expect(snapshot.hasAnyData).toBe(true);
  });

  it("falls back to the latest non-archived resource when nothing is in progress", () => {
    const unreadResource: Resource = {
      ...resourceRecord,
      id: "resource-unread",
      status: "unread",
      updatedAt: "2026-08-07T08:00:00.000Z",
    };
    const archivedResource: Resource = {
      ...resourceRecord,
      id: "resource-archived",
      status: "archived",
      updatedAt: "2026-08-09T08:00:00.000Z",
    };

    const snapshot = buildHomeLearningSnapshot({
      goals: [],
      resources: [archivedResource, unreadResource],
      knowledgeItems: [],
    });

    expect(snapshot.inProgressResources).toEqual([]);
    expect(snapshot.continueLearningResource).toBe(unreadResource);
  });

  it("stays empty when no learning data exists", () => {
    expect(
      buildHomeLearningSnapshot({
        goals: [],
        resources: [],
        knowledgeItems: [],
      })
    ).toEqual({
      activeLearningGoals: [],
      inProgressResources: [],
      recentKnowledgeItems: [],
      continueLearningResource: undefined,
      hasAnyData: false,
    });
  });
});
