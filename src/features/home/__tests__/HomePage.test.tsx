import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import type { HomeDashboardData } from "../types";

const todayTask = {
  id: "home-task-1",
  title: "Review the Home dashboard",
  status: "todo",
  priority: "medium",
  dueDate: new Date().toISOString().slice(0, 10),
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
    unprocessedCount: 1,
  },
  isEmpty: false,
};

vi.mock("../hooks/useHomeDashboard", () => ({
  useHomeDashboard: () => ({
    data: dashboardData,
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

import { HomePage } from "../pages/HomePage";

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps the daily Home workspace direct while lower dashboard content is disclosed", () => {
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <I18nProvider>
          <DateDisplayProvider>
            <HomePage />
          </DateDisplayProvider>
        </I18nProvider>
      </MemoryRouter>
    );

    expect(markup).toContain("Review the Home dashboard");
    expect(markup).toContain("Go to Today");
    expect(markup).toContain("Capture item");
    expect(markup).toContain("Local snapshot");
    expect(markup).toContain("More sections");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("Quick links");
  });
});
