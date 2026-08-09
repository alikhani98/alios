import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  decisionLogRecord,
  goalRecord,
  lifeAreaRecord,
  manualEntryRecord,
  projectRecord,
  taskRecord,
  weeklyPlanRecord,
} from "@/test/factories";

import { WeeklyReviewPage } from "../pages/WeeklyReviewPage";
import { useWeeklyReview } from "../hooks/useWeeklyReview";
import type { WeeklyReviewSummary } from "../weeklyReviewCalculations";

vi.mock("../hooks/useWeeklyReview", () => ({
  useWeeklyReview: vi.fn(),
}));

const mockedUseWeeklyReview = vi.mocked(useWeeklyReview);

function countOccurrences(markup: string, value: string) {
  return markup.split(value).length - 1;
}

function buildSummary(): WeeklyReviewSummary {
  return {
    reviewWindow: {
      days: 7,
      startDate: "2026-07-01",
      endDate: "2026-07-07",
    },
    taskSummary: {
      totalCount: 4,
      completedCount: 2,
      openCount: 2,
      overdueCount: 1,
      dueSoonCount: 1,
      completedInWindowCount: 2,
    },
    routineSummary: {
      linkedTaskCount: 2,
      plannedInWindowCount: 2,
      completedInWindowCount: 1,
      openInWindowCount: 1,
      completionPercent: 50,
    },
    projectSummary: {
      totalCount: 1,
      activeCount: 1,
      projectsWithNextActionCount: 1,
      needsAttentionCount: 1,
      reviewDueEntries: [
        {
          ...projectRecord,
          id: "s256-project",
          title: "S256 Project Review",
        },
      ],
    },
    planningSummary: {
      linkedProjectCount: 1,
      linkedTaskCount: 1,
      completedLinkedTaskCount: 0,
      openLinkedTaskCount: 1,
      completionPercent: 0,
      unavailableGoalProjectCount: 0,
      attentionEntries: [
        {
          project: {
            ...projectRecord,
            id: "s256-planning-project",
            title: "S256 Planning Chain",
          },
          goal: {
            ...goalRecord,
            id: "s256-planning-goal",
            title: "S256 Linked Goal",
          },
          openTaskCount: 1,
        },
      ],
    },
    inboxSummary: {
      totalCount: 1,
      pendingCount: 1,
      processedCount: 0,
      capturedInWindowCount: 1,
    },
    journalSummary: {
      totalCount: 1,
      entriesInWindowCount: 1,
      averageMoodLevel: 4,
      averageEnergyLevel: 3,
    },
    knowledgeSummary: {
      totalCount: 1,
      createdInWindowCount: 1,
    },
    decisionSummary: {
      totalCount: 1,
      createdInWindowCount: 1,
      needsReviewCount: 1,
      reviewedInWindowCount: 0,
      dueEntries: [
        {
          ...decisionLogRecord,
          id: "s256-decision",
          title: "S256 Decision Review",
        },
      ],
    },
    goalSummary: {
      totalCount: 1,
      dueCount: 1,
      dueEntries: [
        {
          ...goalRecord,
          id: "s256-goal",
          title: "S256 Goal Review",
        },
      ],
    },
    lifeAreaSummary: {
      totalCount: 1,
      activeCount: 1,
      highAttentionActiveCount: 1,
      dueCount: 1,
      dueEntries: [
        {
          ...lifeAreaRecord,
          id: "s256-life-area",
          areaKey: "health",
          title: "S256 Life Area Review",
        },
      ],
    },
    manualSummary: {
      totalCount: 1,
      dueCount: 1,
      dueEntries: [
        {
          ...manualEntryRecord,
          id: "s256-manual",
          title: "S256 Manual Review",
        },
      ],
    },
    financeSummary: {
      transactionCount: 1,
      incomeInWindow: 1000,
      expensesInWindow: 250,
      netCashflowInWindow: 750,
      activeObligationsCount: 1,
      upcomingObligationsCount: 1,
      remainingObligationTotal: 500,
      monthlyObligationsEstimate: 100,
    },
    wellnessSummary: {
      checkinCountInWindow: 1,
      notesCountInWindow: 1,
      averageMoodLevel: 4,
      averageEnergyLevel: 3,
    },
    focusObservations: [
      {
        kind: "overdueTasks",
        tone: "needs-review",
        count: 1,
      },
    ],
    suggestedFocus: [
      {
        kind: "reviewGoals",
        tone: "next-focus",
      },
    ],
    emptyStates: [],
    hasAnyData: true,
  };
}

function renderWeeklyReviewPage() {
  mockedUseWeeklyReview.mockReturnValue({
    summary: buildSummary(),
    isLoading: false,
    error: null,
    loadWeeklyReview: async () => undefined,
    markManualEntryReviewed: async () => undefined,
    markGoalReviewed: async () => undefined,
    markLifeAreaReviewed: async () => undefined,
    markProjectReviewed: async () => undefined,
    markDecisionReviewed: async () => undefined,
    weeklyPlan: {
      ...weeklyPlanRecord,
      id: "s256-current-plan",
      focusTitle: "S256 Current Plan",
    },
    previousWeeklyPlan: {
      ...weeklyPlanRecord,
      id: "s256-previous-plan",
      weekStart: "2026-06-29",
      focusTitle: "S256 Previous Plan",
    },
    planningOptions: {
      goals: [goalRecord],
      projects: [projectRecord],
      tasks: [taskRecord],
    },
    saveWeeklyPlan: async () => undefined,
  });

  return renderToStaticMarkup(
    <MemoryRouter>
      <I18nProvider>
        <DateDisplayProvider>
          <WeeklyReviewPage />
        </DateDisplayProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe("WeeklyReviewPage density bands", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    mockedUseWeeklyReview.mockReset();
  });

  it("keeps the weekly plan, queue count, and first review action direct", () => {
    const markup = renderWeeklyReviewPage();

    expect(markup).toContain("S256 Current Plan");
    expect(markup).toContain("S256 Project Review");
    expect(markup).toContain("Mark reviewed");
    expect(markup.indexOf("S256 Project Review")).toBeLessThan(
      markup.indexOf("weekly-review-queue-details-content")
    );
  });

  it("collapses secondary weekly detail bands by default while keeping details reachable", () => {
    const markup = renderWeeklyReviewPage();

    expect(markup).toContain('id="weekly-review-signals-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="weekly-review-goals-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="weekly-review-life-areas-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="weekly-review-manual-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("S256 Goal Review");
    expect(markup).toContain("S256 Life Area Review");
    expect(markup).toContain("S256 Manual Review");
  });

  it("renders focus observations and suggested focus once inside the weekly signals band", () => {
    const markup = renderWeeklyReviewPage();

    expect(markup).toContain("Weekly signals");
    expect(countOccurrences(markup, "What this week says")).toBe(1);
    expect(countOccurrences(markup, "A helpful next focus could be reviewing due goals.")).toBe(1);
  });
});
