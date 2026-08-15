// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { GoalsPage } from "../pages/GoalsPage";

const pageMocks = vi.hoisted(() => {
  const goal = {
    id: "goal-page-fixture",
    title: "Improve sleep",
    description: "Keep a regular bedtime and morning routine.",
    area: "health",
    timeframe: "quarter",
    status: "active",
    importance: "high",
    progressPercent: 35,
    targetDate: "2026-09-30",
    reviewIntervalDays: 7,
    tags: ["health", "routine"],
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  };
  const project = {
    id: "project-page-fixture",
    title: "Sleep routine project",
    description: "Prepare the evening routine",
    status: "active",
    priority: "high",
    goalId: goal.id,
    nextAction: "Set the first reminder",
    reviewDate: "2026-07-06",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  };

  return {
    goal,
    project,
    loadGoals: vi.fn(async () => undefined),
    createGoal: vi.fn(async () => goal),
    updateGoal: vi.fn(async () => goal),
    deleteGoal: vi.fn(async () => undefined),
    markGoalReviewed: vi.fn(async () => goal),
    markGoalCompleted: vi.fn(async () => goal),
    reactivateGoal: vi.fn(async () => goal),
    projectsError: null as string | null,
    loadProjects: vi.fn(async () => undefined),
    storage: {
      tasks: {
        list: vi.fn(),
      },
    },
  };
});

vi.mock("@/core/storage", () => ({
  useStorageAdapter: () => pageMocks.storage,
}));

vi.mock("@/features/projects/hooks/useProjects", () => ({
  useProjects: () => ({
    projects: [pageMocks.project],
    isLoading: false,
    error: pageMocks.projectsError,
    loadProjects: pageMocks.loadProjects,
    createProject: async () => undefined,
    updateProject: async () => undefined,
    deleteProject: async () => undefined,
  }),
}));

vi.mock("../hooks/useGoals", () => ({
  useGoals: () => ({
    entries: [pageMocks.goal],
    isLoading: false,
    error: null,
    loadGoals: pageMocks.loadGoals,
    createGoal: pageMocks.createGoal,
    updateGoal: pageMocks.updateGoal,
    deleteGoal: pageMocks.deleteGoal,
    markGoalReviewed: pageMocks.markGoalReviewed,
    markGoalCompleted: pageMocks.markGoalCompleted,
    reactivateGoal: pageMocks.reactivateGoal,
  }),
}));

async function renderGoalsPage(): Promise<{
  container: HTMLDivElement;
  root: Root;
}> {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/goals"]}>
        <I18nProvider>
          <DateDisplayProvider>
            <GoalsPage />
          </DateDisplayProvider>
        </I18nProvider>
      </MemoryRouter>
    );
  });

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  return { container, root };
}

describe("GoalsPage storage error states", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    pageMocks.storage.tasks.list.mockReset();
    pageMocks.storage.tasks.list.mockResolvedValue([]);
    pageMocks.projectsError = null;
    pageMocks.loadProjects.mockClear();
  });

  it("shows linked work load failures separately from the empty goal state", async () => {
    pageMocks.storage.tasks.list.mockRejectedValueOnce(new Error("Task storage failed."));

    const { container, root } = await renderGoalsPage();

    try {
      expect(container.textContent).toContain("Improve sleep");
      expect(container.textContent).toContain(
        "Linked work could not be loaded. Your goals are still available."
      );
      expect(container.textContent).toContain("Try again");
      expect(container.textContent).not.toContain("Your goals track is ready");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("shows linked project load failures separately from the empty goal state", async () => {
    pageMocks.projectsError = "Project storage failed.";

    const { container, root } = await renderGoalsPage();

    try {
      expect(container.textContent).toContain("Improve sleep");
      expect(container.textContent).toContain(
        "Linked work could not be loaded. Your goals are still available."
      );
      expect(container.textContent).toContain("Try again");
      expect(container.textContent).not.toContain("Your goals track is ready");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
