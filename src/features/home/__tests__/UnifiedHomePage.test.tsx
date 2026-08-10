import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { HomeDashboardData } from "../types";

const todayTask = {
  id: "home-task-1",
  title: "Review the unified Home workspace",
  status: "todo",
  priority: "medium",
  dueDate: "2026-08-09",
  isMit: true,
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-01T08:00:00.000Z",
} as const;

const dashboardData: HomeDashboardData = {
  tasks: [todayTask],
  today: {
    tasks: [todayTask],
    completedTaskCount: 0,
    mitTask: todayTask,
  },
  projects: {
    totalCount: 1,
    activeCount: 1,
    recent: [],
  },
  journal: {
    totalCount: 0,
  },
  knowledge: {
    totalCount: 0,
  },
  goals: {
    totalCount: 1,
    activeCount: 1,
    reviewDueCount: 0,
    highImportanceActiveCount: 0,
    averageActiveProgress: 25,
  },
  finance: {
    transactionCount: 0,
    activeObligationCount: 0,
    remainingLiquidity: 0,
    remainingObligationTotal: 0,
  },
  lifeAreas: {
    totalCount: 0,
    activeCount: 0,
    highAttentionActiveCount: 0,
    reviewDueCount: 0,
    averageSatisfactionScore: null,
  },
  manual: {
    totalCount: 0,
    activeCount: 0,
    reviewDueCount: 0,
  },
  inbox: {
    unprocessedCount: 2,
  },
  isEmpty: false,
};

vi.mock("@/features/today/components/TodayWorkspace", () => ({
  TodayWorkspace: ({
    focusId,
    hideEmptyTaskState,
    hideHero,
    hideTaskSummaryHeader,
    today,
  }: {
    focusId: string | null;
    hideEmptyTaskState?: boolean;
    hideHero?: boolean;
    hideTaskSummaryHeader?: boolean;
    today: string;
  }) => (
    <section data-testid="today-workspace">
      Today workspace for {today}
      {focusId ? ` focused on ${focusId}` : ""}
      {hideHero ? " without hero" : ""}
      {hideTaskSummaryHeader ? " without task summary" : ""}
      {hideEmptyTaskState ? " without empty task state" : ""}
    </section>
  ),
}));

let mockedDashboardData: HomeDashboardData = dashboardData;

vi.mock("../hooks/useHomeDashboard", () => ({
  useHomeDashboard: () => ({
    data: mockedDashboardData,
    isLoading: false,
    hasError: false,
    loadDashboard: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/shared/hooks")>("@/shared/hooks");

  return {
    ...actual,
    useBackupStatus: () => ({
      freshness: "fresh",
      lastBackupAt: null,
      updateLastBackupStatus: vi.fn(),
    }),
  };
});

import { UnifiedHomePage } from "../pages/UnifiedHomePage";

function renderUnifiedHome(initialEntry = "/?date=2026-08-09") {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nProvider>
        <DateDisplayProvider>
          <UnifiedHomePage />
        </DateDisplayProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe("UnifiedHomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    mockedDashboardData = dashboardData;
  });

  it("renders the clear start card and prepared Today workspace without route wiring", () => {
    const markup = renderUnifiedHome("/?date=2026-08-09&focusId=home-task-1");

    expect(markup).toContain("What should I do now?");
    expect(markup).toContain("Review the unified Home workspace");
    expect(markup).toContain("Add task");
    expect(markup).toContain("Capture item");
    expect(markup).toContain("Weekly Review");
    expect(markup).toContain("Today workspace for 2026-08-09 focused on home-task-1");
    expect(markup).toContain("without hero");
    expect(markup).toContain("without task summary");
    expect(markup).toContain("without empty task state");
  });

  it("keeps context direct while More Context starts collapsed", () => {
    const markup = renderUnifiedHome();

    expect(markup).toContain("Today context");
    expect(markup).toContain("Calendar");
    expect(markup).toContain("Inbox");
    expect(markup).toContain('id="unified-home-today-context"');
    expect(markup).toContain('id="unified-home-today-context-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("More sections");
    expect(markup).toContain('id="unified-home-more-context"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="unified-home-more-context-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("Quick links");
  });

  it("guides a no-task day toward a small inbox-processing step", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 32,
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("Your inbox has 32 item(s) waiting");
    expect(markup).toContain("Start small: process 3 item(s)");
    expect(markup).toContain("Process inbox");
    expect(markup).toContain("Start with 3 inbox item(s)");
  });
});
