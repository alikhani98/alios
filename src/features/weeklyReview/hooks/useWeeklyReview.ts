import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import type { LifeAreaKey } from "@/shared/types";
import { clearDueProjectReviewDate } from "@/features/projects/projectReviews";

import {
  buildWeeklyReviewSummary,
  type WeeklyReviewSummary,
} from "../weeklyReviewCalculations";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useWeeklyReview() {
  const {
    tasks,
    projects,
    inbox,
    journal,
    knowledge,
    decisions,
    goals,
    lifeAreas,
    manual,
    finance,
    dailyCheckins,
  } = useStorageAdapter();
  const [summary, setSummary] = useState<WeeklyReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeeklyReview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const referenceDate = new Date();
      const [
        loadedTasks,
        loadedProjects,
        loadedInboxItems,
        loadedJournalEntries,
        loadedKnowledgeItems,
        loadedDecisionLogEntries,
        loadedGoals,
        loadedLifeAreas,
        loadedManualEntries,
        loadedTransactions,
        loadedObligations,
        loadedCheckins,
      ] = await Promise.all([
        tasks.list(),
        projects.list(),
        inbox.list(),
        journal.list(),
        knowledge.list(),
        decisions.list(),
        goals.list(),
        lifeAreas.list(),
        manual.list(),
        finance.listTransactions(),
        finance.listObligations(),
        dailyCheckins.list(),
      ]);

      setSummary(
        buildWeeklyReviewSummary(
          {
            tasks: loadedTasks,
            projects: loadedProjects,
            inboxItems: loadedInboxItems,
            journalEntries: loadedJournalEntries,
            knowledgeItems: loadedKnowledgeItems,
            decisionLogEntries: loadedDecisionLogEntries,
            goals: loadedGoals,
            lifeAreas: loadedLifeAreas,
            manualEntries: loadedManualEntries,
            financeTransactions: loadedTransactions,
            financeObligations: loadedObligations,
            dailyCheckins: loadedCheckins,
          },
          referenceDate
        )
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [
    dailyCheckins,
    decisions,
    finance,
    goals,
    inbox,
    journal,
    knowledge,
    lifeAreas,
    manual,
    projects,
    tasks,
  ]);

  useEffect(() => {
    void loadWeeklyReview();
  }, [loadWeeklyReview]);

  const markManualEntryReviewed = useCallback(
    async (id: string) => {
      try {
        await manual.update(id, { lastReviewedAt: new Date().toISOString() });
        await loadWeeklyReview();
      } catch (updateError) {
        setError(getErrorMessage(updateError));
      }
    },
    [loadWeeklyReview, manual]
  );

  const markGoalReviewed = useCallback(
    async (id: string) => {
      try {
        await goals.markReviewed(id);
        await loadWeeklyReview();
      } catch (updateError) {
        setError(getErrorMessage(updateError));
      }
    },
    [goals, loadWeeklyReview]
  );

  const markLifeAreaReviewed = useCallback(
    async (areaKey: LifeAreaKey) => {
      try {
        await lifeAreas.markReviewed(areaKey);
        await loadWeeklyReview();
      } catch (updateError) {
        setError(getErrorMessage(updateError));
      }
    },
    [lifeAreas, loadWeeklyReview]
  );

  const markProjectReviewed = useCallback(
    async (id: string) => {
      try {
        const project = await projects.getById(id);
        if (!project) {
          throw new Error("Project is no longer available.");
        }
        await projects.update(id, {
          lastReviewedAt: new Date().toISOString(),
          reviewDate: clearDueProjectReviewDate(project),
        });
        await loadWeeklyReview();
      } catch (updateError) {
        setError(getErrorMessage(updateError));
      }
    },
    [loadWeeklyReview, projects]
  );

  const markDecisionReviewed = useCallback(
    async (id: string) => {
      try {
        await decisions.update(id, { status: "reviewed" });
        await loadWeeklyReview();
      } catch (updateError) {
        setError(getErrorMessage(updateError));
      }
    },
    [decisions, loadWeeklyReview]
  );

  return {
    summary,
    isLoading,
    error,
    loadWeeklyReview,
    markManualEntryReviewed,
    markGoalReviewed,
    markLifeAreaReviewed,
    markProjectReviewed,
    markDecisionReviewed,
  };
}
