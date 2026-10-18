// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { Project, Routine, Task } from "@/shared/types";
import { taskRecord } from "@/test/factories";
import { TodayWorkspace, TODAY_COMPLETED_TASKS_OPEN_STORAGE_KEY } from "../components/TodayWorkspace";
import type { TodayWeeklyPlanFocus } from "../todayWeeklyPlan";

const state = vi.hoisted(() => {
  const list = vi.fn(async () => []);
  const getCommitmentByDate = vi.fn(async () => undefined);

  return {
    tasks: [] as Task[],
    routines: [] as Routine[],
    projects: [] as Project[],
    error: null as string | null,
    isLoading: false,
    focus: { linkedTaskTotal: 0, linkedTaskCompleted: 0 } as TodayWeeklyPlanFocus,
    loadToday: vi.fn(),
    list,
    getCommitmentByDate,
    // Match the provider's stable repository identities across renders.
    storageAdapter: {
      journal: { list },
      decisions: { list },
      knowledge: { list },
      dailyCommitments: { getCommitmentByDate },
    },
  };
});

vi.mock("@/core/storage", () => ({
  useStorageAdapter: () => state.storageAdapter,
}));
vi.mock("../hooks/useTodayData", () => ({
  useTodayData: () => ({
    tasks: state.tasks, isLoading: state.isLoading, error: state.error,
    loadToday: state.loadToday,
  }),
}));
vi.mock("../hooks/useTodayWeeklyPlan", () => ({
  useTodayWeeklyPlan: () => ({ focus: state.focus, isLoading: false }),
}));
vi.mock("@/features/projects/hooks/useProjects", () => ({
  useProjects: () => ({ projects: state.projects, isLoading: false, error: null }),
}));
vi.mock("@/features/routines/hooks/useRoutines", () => ({
  useRoutines: () => ({ entries: state.routines, isLoading: false, error: null }),
}));

describe("Today workspace presentation", () => {
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    state.tasks = [];
    state.routines = [];
    state.projects = [];
    state.error = null;
    state.isLoading = false;
    state.focus = { linkedTaskTotal: 0, linkedTaskCompleted: 0 };
    state.loadToday.mockReset();
    state.list.mockClear();
    state.getCommitmentByDate.mockClear();
    scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    vi.useRealTimers();
    container.remove();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalScrollIntoView) {
      Object.defineProperty(Element.prototype, "scrollIntoView", originalScrollIntoView);
    } else {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  async function renderWorkspace(query = "", filters: { projectId?: string; goalId?: string; routineId?: string } = {}) {
    const params = new URLSearchParams(query);
    await act(async () => root.render(
      <MemoryRouter initialEntries={[`/today?${query}`]}>
        <I18nProvider>
          <DateDisplayProvider>
            <TodayWorkspace
              today="2026-07-18"
              focusId={params.get("focusId")}
              projectId={filters.projectId ?? null}
              goalId={filters.goalId ?? null}
              routineId={filters.routineId ?? null}
              hideRecoveryCard
            />
          </DateDisplayProvider>
        </I18nProvider>
      </MemoryRouter>
    ));
  }

  it("does not reload linked repositories after unrelated task-state renders", async () => {
    state.isLoading = true;
    await renderWorkspace();
    expect(state.list).toHaveBeenCalledTimes(3);
    expect(state.getCommitmentByDate).toHaveBeenCalledOnce();

    state.isLoading = false;
    await renderWorkspace();
    expect(container.querySelector(".alios-today-empty")).not.toBeNull();
    expect(state.list).toHaveBeenCalledTimes(3);
    expect(state.getCommitmentByDate).toHaveBeenCalledOnce();
  });

  it.each([
    { language: "en", direction: "ltr" },
    { language: "fa", direction: "rtl" },
  ])("renders an accessible initial error without an empty state ($language)", async ({ language, direction }) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    state.error = "Unavailable storage";
    await renderWorkspace();

    expect(document.documentElement.lang).toBe(language);
    expect(document.documentElement.dir).toBe(direction);
    const alert = container.querySelector("[role='alert']");
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("Unavailable storage");
    expect(alert?.querySelector("button")).not.toBeNull();
    expect(container.querySelector(".alios-today-empty")).toBeNull();
  });

  it.each(["en", "fa"])("distinguishes loading, failure, retry and confirmed empty data (%s)", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    state.isLoading = true;
    await renderWorkspace();
    const execution = container.querySelector(".alios-today-execution");
    expect(execution?.getAttribute("aria-busy")).toBe("true");
    const loadingStatus = execution?.querySelector("[role='status']");
    expect(loadingStatus).not.toBeNull();
    expect(loadingStatus?.textContent).toContain(language === "fa" ? "در حال بارگذاری کارهای امروز" : "Loading today's tasks");
    expect(execution?.querySelector(".alios-today-empty")).toBeNull();
    expect(execution?.querySelector("[aria-hidden='true']")?.classList.contains("motion-safe:animate-pulse")).toBe(true);

    state.isLoading = false;
    state.error = "Unavailable storage";
    await renderWorkspace();
    expect(container.querySelector("[role='alert']")?.textContent).toContain(state.error);
    expect(execution?.querySelector(".alios-today-empty")).toBeNull();
    const retry = container.querySelector<HTMLButtonElement>("[role='alert'] button");
    expect(retry).not.toBeNull();
    state.loadToday.mockImplementation(() => {
      state.error = null;
      state.isLoading = true;
    });
    await act(async () => retry?.click());
    expect(state.loadToday).toHaveBeenCalledOnce();

    await renderWorkspace();
    expect(execution?.getAttribute("aria-busy")).toBe("true");
    expect(execution?.querySelector("[role='status']")).not.toBeNull();
    expect(container.querySelector("[role='alert']")).toBeNull();
    expect(execution?.querySelector(".alios-today-empty")).toBeNull();

    state.isLoading = false;
    await renderWorkspace();
    expect(execution?.querySelector(".alios-today-empty")).not.toBeNull();
    expect(execution?.getAttribute("aria-busy")).toBe("false");
  });

  it.each([
    { mode: "full", limit: 12, remaining: 3 },
    { mode: "simple", limit: 6, remaining: 9 },
  ])("applies the $mode task preview to completed cards and reveals all on request", async ({ mode, limit, remaining }) => {
    localStorage.setItem("alios.viewDensityMode", mode);
    state.tasks = Array.from({ length: 15 }, (_, index) => ({
      ...taskRecord, id: `done-${index}`, title: `Completed ${index}`, status: "done", isMit: false,
    }));
    await renderWorkspace();
    expect(container.querySelectorAll(".alios-today-task")).toHaveLength(limit);
    const reveal = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes(`Show ${remaining} more`));
    expect(reveal).toBeDefined();
    await act(async () => reveal?.click());
    expect(container.querySelectorAll(".alios-today-task")).toHaveLength(15);
  });

  it("keeps completed cards out of Focus Mode when active tasks exist", async () => {
    state.tasks = [
      { ...taskRecord, id: "open", status: "todo" },
      { ...taskRecord, id: "done", title: "Completed task", status: "done" },
    ];
    await renderWorkspace();
    const focus = container.querySelector<HTMLButtonElement>("button[aria-pressed]");
    await act(async () => focus?.click());
    expect(container.querySelectorAll(".alios-today-task")).toHaveLength(1);
    expect(container.querySelector(".alios-today-completed")).toBeNull();
  });

  it("reveals a completed deep link beyond the preview without overwriting the saved preference", async () => {
    localStorage.setItem(TODAY_COMPLETED_TASKS_OPEN_STORAGE_KEY, "false");
    state.tasks = Array.from({ length: 15 }, (_, index) => ({
      ...taskRecord, id: `done-${index}`, title: `Completed ${index}`, status: "done", isMit: false,
    }));
    await renderWorkspace("focusId=done-14");
    const content = container.querySelector<HTMLElement>("#today-completed-tasks-content");
    expect(content?.hidden).toBe(false);
    expect(content?.textContent).toContain("Completed 14");
    expect(scrollIntoView).toHaveBeenCalled();
    expect(localStorage.getItem(TODAY_COMPLETED_TASKS_OPEN_STORAGE_KEY)).toBe("false");
  });

  it("reveals the weekly-plan destination and respects reduced-motion scrolling", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    state.focus = {
      linkedTaskTotal: 1, linkedTaskCompleted: 0,
      task: { ...taskRecord, id: "planned", title: "Planned elsewhere", dueDate: "2026-07-19" },
    };
    await renderWorkspace("focusId=planned");
    expect(container.querySelector<HTMLElement>("#today-daily-insights-content")?.hidden).toBe(false);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
    const toggle = container.querySelector<HTMLButtonElement>("#today-daily-insights > button");
    await act(async () => toggle?.click());
    expect(container.querySelector<HTMLElement>("#today-daily-insights-content")?.hidden).toBe(true);
  });

  it("does not restart focus scrolling when the temporary highlight expires", async () => {
    vi.useFakeTimers();
    state.tasks = [{ ...taskRecord, id: "focused", status: "todo" }];
    try {
      await renderWorkspace("focusId=focused");
      const initialScrollCount = scrollIntoView.mock.calls.length;
      expect(initialScrollCount).toBeGreaterThan(0);
      await act(async () => { vi.advanceTimersByTime(2300); });
      expect(scrollIntoView).toHaveBeenCalledTimes(initialScrollCount);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(["projectId", "goalId", "routineId"] as const)("clears only %s while retaining the selected date", async (filter) => {
    await renderWorkspace(`date=2026-07-18&${filter}=filter-id&focusId=task-id`, { [filter]: "filter-id" });
    const link = container.querySelector<HTMLAnchorElement>("[role='status'] a");
    expect(link).not.toBeNull();
    const url = new URL(link?.href ?? "", "http://localhost");
    expect(url.searchParams.get("date")).toBe("2026-07-18");
    expect(url.searchParams.has(filter)).toBe(false);
    expect(url.searchParams.get("focusId")).toBe("task-id");
  });

  it("uses the selected day's weekday for routine suggestions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 19, 12));
    state.routines = [{
      id: "saturday", title: "Saturday routine", weekdays: [6], priority: "medium", isActive: true,
      createdAt: taskRecord.createdAt, updatedAt: taskRecord.updatedAt,
    }];
    try {
      await renderWorkspace();
      expect(container.querySelector("#today-routine-suggestions-content")?.textContent).toContain("Saturday routine");
    } finally {
      vi.useRealTimers();
    }
  });
});
