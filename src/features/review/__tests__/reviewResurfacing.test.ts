import { describe, expect, it } from "vitest";

import {
  decisionLogRecord,
  goalRecord,
  knowledgeItemRecord,
  manualEntryRecord,
  projectRecord,
  resourceRecord,
} from "@/test/factories";

import { buildReviewResurfacingSnapshot } from "../reviewResurfacing";

describe("buildReviewResurfacingSnapshot", () => {
  it("derives knowledge and resource candidates without storing review state", () => {
    const activeGoal = {
      ...goalRecord,
      id: "goal-active",
      title: "Learn SQL",
      status: "active" as const,
      updatedAt: "2026-09-01T08:00:00.000Z",
    };
    const inProgressResource = {
      ...resourceRecord,
      id: "resource-progress",
      title: "SQL Course",
      status: "in_progress" as const,
      goalId: activeGoal.id,
      updatedAt: "2026-09-10T08:00:00.000Z",
    };
    const linkedKnowledge = {
      ...knowledgeItemRecord,
      id: "knowledge-linked",
      title: "SQL joins note",
      goalId: activeGoal.id,
      resourceId: inProgressResource.id,
      updatedAt: "2026-09-10T08:00:00.000Z",
    };
    const olderKnowledge = {
      ...knowledgeItemRecord,
      id: "knowledge-old",
      title: "Old indexing note",
      updatedAt: "2026-07-01T08:00:00.000Z",
    };

    const snapshot = buildReviewResurfacingSnapshot(
      {
        knowledgeItems: [linkedKnowledge, olderKnowledge],
        resources: [inProgressResource],
        goals: [activeGoal],
        projects: [],
        decisions: [],
        manualEntries: [],
      },
      new Date("2026-09-12T12:00:00.000Z")
    );

    expect(snapshot.knowledgeCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "knowledge-linked",
          reason: "linkedActiveGoal",
          context: expect.objectContaining({
            type: "goal",
            title: "Learn SQL",
          }),
        }),
        expect.objectContaining({
          id: "knowledge-old",
          reason: "olderKnowledge",
        }),
      ])
    );
    expect(snapshot.resourceCandidates[0]).toMatchObject({
      id: "resource-progress",
      reason: "resourceInProgress",
      to: "/resources/resource-progress",
    });
    expect(snapshot.hasAnyCandidates).toBe(true);
  });

  it("includes existing review candidates from owning domain rules", () => {
    const dueGoal = {
      ...goalRecord,
      id: "goal-due",
      title: "Quarterly goal",
      status: "active" as const,
      reviewIntervalDays: 7,
      updatedAt: "2026-09-01T08:00:00.000Z",
    };
    const dueProject = {
      ...projectRecord,
      id: "project-due",
      title: "Website launch",
      status: "active" as const,
      reviewDate: "2026-09-10",
    };
    const dueDecision = {
      ...decisionLogRecord,
      id: "decision-due",
      title: "Hosting choice",
      status: "decided" as const,
      reviewDate: "2026-09-10",
    };
    const dueManualEntry = {
      ...manualEntryRecord,
      id: "manual-due",
      title: "Review principle",
      status: "active" as const,
      reviewIntervalDays: 7,
      updatedAt: "2026-09-01T08:00:00.000Z",
    };

    const snapshot = buildReviewResurfacingSnapshot(
      {
        knowledgeItems: [],
        resources: [],
        goals: [dueGoal],
        projects: [dueProject],
        decisions: [dueDecision],
        manualEntries: [dueManualEntry],
      },
      new Date("2026-09-12T12:00:00.000Z")
    );

    expect(snapshot.existingReviewCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "goal-due", reason: "goalReviewDue" }),
        expect.objectContaining({ id: "project-due", reason: "projectReviewDue" }),
        expect.objectContaining({ id: "decision-due", reason: "decisionReviewDue" }),
        expect.objectContaining({ id: "manual-due", reason: "manualReviewDue" }),
      ])
    );
    expect(snapshot.totalCandidateCount).toBe(4);
  });
});
