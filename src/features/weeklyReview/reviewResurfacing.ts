import { subDays } from "date-fns";

import { isDecisionNeedsReview } from "@/features/decisions/decisionLog";
import { getReviewDueGoals } from "@/features/goals";
import { isManualEntryReviewDue } from "@/features/manual/manualEntries";
import { isProjectReviewDue } from "@/features/projects/projectReviews";
import type {
  DecisionLogEntry,
  Goal,
  KnowledgeItem,
  ManualEntry,
  Project,
  Resource,
} from "@/shared/types";

export type ReviewResurfacingCandidateType =
  | "knowledge"
  | "resource"
  | "goal"
  | "project"
  | "decision"
  | "manual";

export type ReviewResurfacingContextType = "goal" | "project" | "resource";

export type ReviewResurfacingReason =
  | "linkedActiveGoal"
  | "linkedInProgressResource"
  | "olderKnowledge"
  | "recentLearningKnowledge"
  | "resourceInProgress"
  | "resourceLinkedActiveGoal"
  | "resourceLinkedActiveProject"
  | "staleResource"
  | "goalReviewDue"
  | "projectReviewDue"
  | "decisionReviewDue"
  | "manualReviewDue";

export type ReviewResurfacingContext = {
  type: ReviewResurfacingContextType;
  title: string;
  to: string;
};

export type ReviewResurfacingCandidate = {
  id: string;
  type: ReviewResurfacingCandidateType;
  title: string;
  to: string;
  reason: ReviewResurfacingReason;
  context?: ReviewResurfacingContext;
  sortKey: string;
  score: number;
};

export type ReviewResurfacingSnapshot = {
  knowledgeCandidates: ReviewResurfacingCandidate[];
  resourceCandidates: ReviewResurfacingCandidate[];
  existingReviewCandidates: ReviewResurfacingCandidate[];
  topCandidates: ReviewResurfacingCandidate[];
  totalCandidateCount: number;
  hasAnyCandidates: boolean;
};

export type ReviewResurfacingInput = {
  knowledgeItems: ReadonlyArray<KnowledgeItem>;
  resources: ReadonlyArray<Resource>;
  goals: ReadonlyArray<Goal>;
  projects: ReadonlyArray<Project>;
  decisions: ReadonlyArray<DecisionLogEntry>;
  manualEntries: ReadonlyArray<ManualEntry>;
};

const RECENT_LEARNING_DAYS = 14;
const OLDER_KNOWLEDGE_DAYS = 45;
const STALE_RESOURCE_DAYS = 30;

function createFocusPath(path: string, id: string): string {
  return `${path}?${new URLSearchParams({ focusId: id }).toString()}`;
}

function createResourcePath(id: string): string {
  return `/resources/${encodeURIComponent(id)}`;
}

function isOnOrBefore(value: string, cutoff: Date): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= cutoff.getTime();
}

function isOnOrAfter(value: string, cutoff: Date): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= cutoff.getTime();
}

function sortCandidates(
  candidates: ReadonlyArray<ReviewResurfacingCandidate>
): ReviewResurfacingCandidate[] {
  return [...candidates].sort(
    (left, right) =>
      right.score - left.score || right.sortKey.localeCompare(left.sortKey)
  );
}

function upsertCandidate(
  candidates: Map<string, ReviewResurfacingCandidate>,
  candidate: ReviewResurfacingCandidate
) {
  const existing = candidates.get(candidate.id);
  if (
    !existing ||
    candidate.score > existing.score ||
    (candidate.score === existing.score &&
      candidate.sortKey.localeCompare(existing.sortKey) > 0)
  ) {
    candidates.set(candidate.id, candidate);
  }
}

function getGoalContext(goal: Goal): ReviewResurfacingContext {
  return {
    type: "goal",
    title: goal.title,
    to: createFocusPath("/goals", goal.id),
  };
}

function getProjectContext(project: Project): ReviewResurfacingContext {
  return {
    type: "project",
    title: project.title,
    to: createFocusPath("/projects", project.id),
  };
}

function getResourceContext(resource: Resource): ReviewResurfacingContext {
  return {
    type: "resource",
    title: resource.title,
    to: createResourcePath(resource.id),
  };
}

export function buildReviewResurfacingSnapshot(
  input: ReviewResurfacingInput,
  referenceDate = new Date()
): ReviewResurfacingSnapshot {
  const activeGoalsById = new Map(
    input.goals
      .filter((goal) => goal.status === "active")
      .map((goal) => [goal.id, goal])
  );
  const activeProjectsById = new Map(
    input.projects
      .filter((project) => project.status === "active")
      .map((project) => [project.id, project])
  );
  const inProgressResourcesById = new Map(
    input.resources
      .filter((resource) => resource.status === "in_progress")
      .map((resource) => [resource.id, resource])
  );
  const olderKnowledgeCutoff = subDays(referenceDate, OLDER_KNOWLEDGE_DAYS);
  const recentLearningCutoff = subDays(referenceDate, RECENT_LEARNING_DAYS);
  const staleResourceCutoff = subDays(referenceDate, STALE_RESOURCE_DAYS);

  const knowledgeCandidates = new Map<string, ReviewResurfacingCandidate>();
  const resourceCandidates = new Map<string, ReviewResurfacingCandidate>();

  for (const item of input.knowledgeItems) {
    const activeGoal = item.goalId
      ? activeGoalsById.get(item.goalId)
      : undefined;
    const activeProject = item.projectId
      ? activeProjectsById.get(item.projectId)
      : undefined;
    const inProgressResource = item.resourceId
      ? inProgressResourcesById.get(item.resourceId)
      : undefined;
    const projectGoal = activeProject?.goalId
      ? activeGoalsById.get(activeProject.goalId)
      : undefined;
    const isLearningRelated = Boolean(
      activeGoal || activeProject || projectGoal || inProgressResource
    );

    if (activeGoal || projectGoal) {
      upsertCandidate(knowledgeCandidates, {
        id: item.id,
        type: "knowledge",
        title: item.title,
        to: createFocusPath("/knowledge", item.id),
        reason: "linkedActiveGoal",
        context: activeGoal
          ? getGoalContext(activeGoal)
          : projectGoal
            ? getGoalContext(projectGoal)
            : undefined,
        sortKey: item.updatedAt,
        score: 90,
      });
    }

    if (inProgressResource) {
      upsertCandidate(knowledgeCandidates, {
        id: item.id,
        type: "knowledge",
        title: item.title,
        to: createFocusPath("/knowledge", item.id),
        reason: "linkedInProgressResource",
        context: getResourceContext(inProgressResource),
        sortKey: item.updatedAt,
        score: 80,
      });
    }

    if (isLearningRelated && isOnOrAfter(item.updatedAt, recentLearningCutoff)) {
      upsertCandidate(knowledgeCandidates, {
        id: item.id,
        type: "knowledge",
        title: item.title,
        to: createFocusPath("/knowledge", item.id),
        reason: "recentLearningKnowledge",
        context: activeGoal
          ? getGoalContext(activeGoal)
          : activeProject
            ? getProjectContext(activeProject)
            : inProgressResource
              ? getResourceContext(inProgressResource)
              : projectGoal
                ? getGoalContext(projectGoal)
                : undefined,
        sortKey: item.updatedAt,
        score: 70,
      });
    }

    if (isOnOrBefore(item.updatedAt, olderKnowledgeCutoff)) {
      upsertCandidate(knowledgeCandidates, {
        id: item.id,
        type: "knowledge",
        title: item.title,
        to: createFocusPath("/knowledge", item.id),
        reason: "olderKnowledge",
        sortKey: item.updatedAt,
        score: 40,
      });
    }
  }

  for (const resource of input.resources) {
    const activeGoal = resource.goalId
      ? activeGoalsById.get(resource.goalId)
      : undefined;
    const activeProject = resource.projectId
      ? activeProjectsById.get(resource.projectId)
      : undefined;
    const projectGoal = activeProject?.goalId
      ? activeGoalsById.get(activeProject.goalId)
      : undefined;

    if (resource.status === "in_progress") {
      upsertCandidate(resourceCandidates, {
        id: resource.id,
        type: "resource",
        title: resource.title,
        to: createResourcePath(resource.id),
        reason: "resourceInProgress",
        context: activeGoal
          ? getGoalContext(activeGoal)
          : activeProject
            ? getProjectContext(activeProject)
            : undefined,
        sortKey: resource.updatedAt,
        score: 90,
      });
    }

    if (activeGoal || projectGoal) {
      upsertCandidate(resourceCandidates, {
        id: resource.id,
        type: "resource",
        title: resource.title,
        to: createResourcePath(resource.id),
        reason: "resourceLinkedActiveGoal",
        context: activeGoal
          ? getGoalContext(activeGoal)
          : projectGoal
            ? getGoalContext(projectGoal)
            : undefined,
        sortKey: resource.updatedAt,
        score: 80,
      });
    }

    if (activeProject) {
      upsertCandidate(resourceCandidates, {
        id: resource.id,
        type: "resource",
        title: resource.title,
        to: createResourcePath(resource.id),
        reason: "resourceLinkedActiveProject",
        context: getProjectContext(activeProject),
        sortKey: resource.updatedAt,
        score: 70,
      });
    }

    if (
      resource.status !== "completed" &&
      resource.status !== "archived" &&
      isOnOrBefore(resource.updatedAt, staleResourceCutoff)
    ) {
      upsertCandidate(resourceCandidates, {
        id: resource.id,
        type: "resource",
        title: resource.title,
        to: createResourcePath(resource.id),
        reason: "staleResource",
        context: activeGoal
          ? getGoalContext(activeGoal)
          : activeProject
            ? getProjectContext(activeProject)
            : undefined,
        sortKey: resource.updatedAt,
        score: 50,
      });
    }
  }

  const existingReviewCandidates: ReviewResurfacingCandidate[] = [
    ...getReviewDueGoals(input.goals, referenceDate).map((goal) => ({
      id: goal.id,
      type: "goal" as const,
      title: goal.title,
      to: createFocusPath("/goals", goal.id),
      reason: "goalReviewDue" as const,
      sortKey: goal.updatedAt,
      score: 85,
    })),
    ...input.projects
      .filter((project) => isProjectReviewDue(project, referenceDate))
      .map((project) => {
        const linkedGoal = project.goalId
          ? activeGoalsById.get(project.goalId)
          : undefined;

        return {
          id: project.id,
          type: "project" as const,
          title: project.title,
          to: createFocusPath("/projects", project.id),
          reason: "projectReviewDue" as const,
          context: linkedGoal ? getGoalContext(linkedGoal) : undefined,
          sortKey: project.updatedAt,
          score: 85,
        };
      }),
    ...input.decisions
      .filter((decision) => isDecisionNeedsReview(decision, referenceDate))
      .map((decision) => ({
        id: decision.id,
        type: "decision" as const,
        title: decision.title,
        to: createFocusPath("/decisions", decision.id),
        reason: "decisionReviewDue" as const,
        sortKey: decision.updatedAt,
        score: 85,
      })),
    ...input.manualEntries
      .filter(
        (entry) =>
          entry.status === "active" &&
          isManualEntryReviewDue(entry, referenceDate)
      )
      .map((entry) => ({
        id: entry.id,
        type: "manual" as const,
        title: entry.title,
        to: createFocusPath("/manual", entry.id),
        reason: "manualReviewDue" as const,
        sortKey: entry.updatedAt,
        score: 85,
      })),
  ];

  const sortedKnowledgeCandidates = sortCandidates(
    Array.from(knowledgeCandidates.values())
  ).slice(0, 6);
  const sortedResourceCandidates = sortCandidates(
    Array.from(resourceCandidates.values())
  ).slice(0, 6);
  const sortedExistingReviewCandidates = sortCandidates(
    existingReviewCandidates
  ).slice(0, 6);
  const topCandidates = sortCandidates([
    ...sortedKnowledgeCandidates,
    ...sortedResourceCandidates,
    ...sortedExistingReviewCandidates,
  ]).slice(0, 8);

  const totalCandidateCount =
    knowledgeCandidates.size +
    resourceCandidates.size +
    existingReviewCandidates.length;

  return {
    knowledgeCandidates: sortedKnowledgeCandidates,
    resourceCandidates: sortedResourceCandidates,
    existingReviewCandidates: sortedExistingReviewCandidates,
    topCandidates,
    totalCandidateCount,
    hasAnyCandidates: totalCandidateCount > 0,
  };
}
