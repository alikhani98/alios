import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";

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
  }, [dailyCheckins, decisions, finance, goals, inbox, journal, manual, knowledge, projects, tasks]);

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

  return { summary, isLoading, error, loadWeeklyReview, markManualEntryReviewed, markGoalReviewed };
}
