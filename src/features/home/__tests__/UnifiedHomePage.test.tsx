import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type {
  BackupStatusFreshness,
  BackupStatusMetadata,
} from "@/shared/preferences/backupStatus";
import {
  goalRecord,
  knowledgeItemRecord,
  resourceRecord,
} from "@/test/factories";
import type { HomeDashboardData } from "../types";
import { HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY } from "../backupReminder";
import { buildHomeLearningSnapshot } from "../homeLearningSnapshot";
import { getDailyBriefingViewModel } from "../components/DailyBriefingCard";
import { buildHomePersonalMetrics } from "../personalMetrics";
import { buildLocalReminderSnapshot } from "@/features/reminders";

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

const overdueTask = {
  id: "home-task-overdue",
  title: "Send the overdue document",
  status: "todo",
  priority: "high",
  dueDate: "2026-08-01",
  isMit: false,
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-02T08:00:00.000Z",
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
  resources: {
    totalCount: 0,
    inProgressCount: 0,
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
  learningSnapshot: buildHomeLearningSnapshot({
    goals: [],
    resources: [],
    knowledgeItems: [],
  }),
  reminderSnapshot: buildLocalReminderSnapshot(
    [overdueTask],
    [],
    new Date("2026-08-09T08:00:00.000Z")
  ),
  personalMetrics: buildHomePersonalMetrics(
    {
      tasks: [todayTask],
      journalEntries: [],
      knowledgeItems: [],
      projects: [],
      goals: [],
      dailyCheckins: [],
    },
    new Date("2026-08-09T08:00:00.000Z")
  ),
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

vi.mock("@/shared/quickAccess", () => ({
  QuickAccessLauncher: () => null,
}));

let mockedDashboardData: HomeDashboardData = dashboardData;
let mockedBackupStatus: BackupStatusMetadata | null = null;
let mockedBackupFreshness: BackupStatusFreshness = "fresh";

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
      freshness: mockedBackupFreshness,
      status: mockedBackupStatus,
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 8, 0, 0));
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    mockedDashboardData = dashboardData;
    mockedBackupStatus = {
      lastBackupAt: "2026-08-09T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-09T07:00:00.000Z",
    };
    mockedBackupFreshness = "fresh";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the decision-layer home sections without embedding Today workspace", () => {
    const markup = renderUnifiedHome("/?date=2026-08-09&focusId=home-task-1");

    expect(markup).toContain("What should I do now?");
    expect(markup).toContain("Your next step is here.");
    expect(markup).toContain("Current focus");
    expect(markup).toContain("Review the unified Home workspace");
    expect(markup).toContain("Start task");
    expect(markup).toContain("Other options");
    expect(markup).toContain("0 task(s) done");
    expect(markup).toContain("1 task(s) remaining");
    expect(markup).toContain("Today’s tasks (1)");
    expect(markup).toContain("See all today’s tasks");
    expect(markup).toContain("Important task tomorrow");
    expect(markup).toContain("More sections");
    expect(markup).not.toContain("Today workspace for 2026-08-09");
    expect(markup).not.toContain("Morning briefing");
  });

  it("keeps More sections collapsed by default", () => {
    const markup = renderUnifiedHome();

    expect(markup).toContain("More sections");
    expect(markup).toContain('id="unified-home-more-context"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="unified-home-more-context-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("Quick links");
  });

  it("shows a compact Learning & Knowledge panel after Quick Access", () => {
    mockedDashboardData = {
      ...dashboardData,
      learningSnapshot: buildHomeLearningSnapshot({
        goals: [
          {
            ...goalRecord,
            id: "goal-learning",
            title: "Become data analyst",
            status: "active",
            updatedAt: "2026-08-08T08:00:00.000Z",
          },
        ],
        resources: [
          {
            ...resourceRecord,
            id: "resource-learning",
            title: "SQL Course",
            status: "in_progress",
            progressPercent: 40,
            updatedAt: "2026-08-07T08:00:00.000Z",
          },
        ],
        knowledgeItems: [
          {
            ...knowledgeItemRecord,
            id: "knowledge-learning",
            title: "Join strategy note",
            resourceId: "resource-learning",
            updatedAt: "2026-08-09T08:00:00.000Z",
          },
        ],
      }),
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("Learning &amp; Knowledge");
    expect(markup).toContain("Currently learning");
    expect(markup).toContain("Continue learning");
    expect(markup).toContain("Recent Knowledge");
    expect(markup).toContain("Become data analyst");
    expect(markup).toContain("SQL Course");
    expect(markup).toContain("Progress: 40%");
    expect(markup).toContain("Join strategy note");
    expect(markup).toContain("/goals?focusId=goal-learning");
    expect(markup).toContain("/resources/resource-learning");
    expect(markup).toContain("/knowledge?focusId=knowledge-learning");
  });

  it("shows the backup reminder when the last backup is older than seven days", () => {
    mockedBackupStatus = {
      lastBackupAt: "2026-08-01T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-01T07:00:00.000Z",
    };
    mockedBackupFreshness = "dueSoon";

    const markup = renderUnifiedHome();

    expect(markup).toContain("Backup reminder");
    expect(markup).toContain("Last backup was 8 day(s) ago");
    expect(markup).toContain("Open backup settings");
    expect(markup).toContain("Hide for 3 days");
  });

  it("hides the backup reminder when the last backup is recent", () => {
    mockedBackupStatus = {
      lastBackupAt: "2026-08-06T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-06T07:00:00.000Z",
    };
    mockedBackupFreshness = "fresh";

    const markup = renderUnifiedHome();

    expect(markup).not.toContain("Backup reminder");
    expect(markup).not.toContain("Open backup settings");
  });

  it("hides the backup reminder for three days after dismiss", () => {
    mockedBackupStatus = {
      lastBackupAt: "2026-08-01T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-01T07:00:00.000Z",
    };
    mockedBackupFreshness = "dueSoon";
    localStorage.setItem(
      HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY,
      "2026-08-12T08:00:00.000Z"
    );

    const hiddenMarkup = renderUnifiedHome();

    expect(hiddenMarkup).not.toContain("Backup reminder");

    vi.setSystemTime(new Date("2026-08-12T08:01:00.000Z"));

    const visibleMarkup = renderUnifiedHome();

    expect(visibleMarkup).toContain("Backup reminder");
    expect(visibleMarkup).toContain("Last backup was 11 day(s) ago");
  });

  it("shows the empty clear-start state when no task is set for today", () => {
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

    expect(markup).toContain("Next action");
    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).toContain("Today’s tasks (0)");
    expect(markup).not.toContain("Your inbox has 32 item(s) waiting");
  });

  it("does not promote overdue backlog tasks into the clear-start card", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [overdueTask],
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

    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).not.toContain("Send the overdue document");
    expect(markup).not.toContain("Your inbox has 32 item(s) waiting");
  });

  it("does not promote routine suggestions into the clear-start card", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 0,
      },
      routineSuggestion: {
        id: "routine-one",
        title: "Morning review",
        weekdays: [2],
        priority: "medium",
        isActive: true,
        createdAt: "2026-08-01T08:00:00.000Z",
        updatedAt: "2026-08-01T08:00:00.000Z",
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).not.toContain("Keep Morning review moving today");
    expect(markup).not.toContain("Routine ready");
  });

  it("keeps the no-task home state focused on defining today’s task", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 0,
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).not.toContain("Your inbox has 32 item(s) waiting");
    expect(markup).not.toContain("Keep Morning review moving today");
  });

  it("keeps the daily briefing time-aware without changing dashboard data", () => {
    const morning = getDailyBriefingViewModel(
      dashboardData,
      new Date("2026-08-09T08:00:00.000Z")
    );
    const midday = getDailyBriefingViewModel(
      dashboardData,
      new Date("2026-08-09T13:00:00.000Z")
    );
    const evening = getDailyBriefingViewModel(
      dashboardData,
      new Date("2026-08-09T19:00:00.000Z")
    );

    expect(morning.titleKey).toBe("home.dailyBriefingMorningTitle");
    expect(morning.actionHref).toBe("/today");
    expect(midday.titleKey).toBe("home.dailyBriefingMiddayTitle");
    expect(midday.descriptionValues).toMatchObject({ completed: 0, remaining: 1 });
    expect(evening.titleKey).toBe("home.dailyBriefingEveningTitle");
    expect(evening.actionHref).toBe("/today");
  });

  it("sends a clear evening to Journal instead of inventing backend work", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 2,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 0,
      },
    };

    const evening = getDailyBriefingViewModel(
      mockedDashboardData,
      new Date("2026-08-09T20:00:00.000Z")
    );

    expect(evening.descriptionKey).toBe("home.dailyBriefingEveningClearDescription");
    expect(evening.actionHref).toBe("/journal");
  });
});
