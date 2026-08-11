import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { projectRecord, taskRecord } from "@/test/factories";

import { TodayTaskCard } from "../components/TodayTaskCard";
import { TodayTaskForm } from "../components/TodayTaskForm";
import { TodayTimeBlockingTimeline } from "../components/TodayTimeBlockingTimeline";
import { TodayWeeklyPlanCard } from "../components/TodayWeeklyPlanCard";
import { getFocusModeTasks } from "../components/TodayWorkspace";
import {
  createAllTodayTasksPath,
  createLinkedProjectPath,
  findLinkedProject,
  findProjectFilter,
} from "../taskProjectLinks";
import { todayTaskFormSchema } from "../types";

function renderTodayUi(element: ReactElement): string {
  return renderToStaticMarkup(
    <StaticRouter location="/today">
      <I18nProvider>{element}</I18nProvider>
    </StaticRouter>
  );
}

const taskActions = {
  isBusy: false,
  onEdit: () => undefined,
  onStatusChange: async () => undefined,
  onSelectMit: async () => undefined,
  onDelete: async () => undefined,
};

describe("Task project links", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("creates a stable encoded Project focus path", () => {
    expect(createLinkedProjectPath("project / one")).toBe(
      "/projects?focusId=project+%2F+one"
    );
  });

  it("resolves and clears a safe Today project filter", () => {
    expect(createAllTodayTasksPath()).toBe("/today");
    expect(findProjectFilter(projectRecord.id, [projectRecord])).toEqual(projectRecord);
    expect(findProjectFilter("deleted-project", [projectRecord])).toBeUndefined();
    expect(findProjectFilter(null, [projectRecord])).toBeUndefined();
  });

  it("finds linked projects without changing unlinked legacy tasks", () => {
    expect(findLinkedProject(taskRecord, [projectRecord])).toEqual(
      projectRecord
    );
    expect(
      findLinkedProject({ ...taskRecord, projectId: undefined }, [projectRecord])
    ).toBeUndefined();
    expect(
      findLinkedProject({ ...taskRecord, projectId: "missing" }, [projectRecord])
    ).toBeUndefined();
  });

  it("allows an empty optional Project value in the Task form", () => {
    expect(
      todayTaskFormSchema.safeParse({
        title: "Legacy task",
        description: "",
        status: "todo",
        priority: "medium",
        isMit: false,
        dueDate: "2026-07-17",
        projectId: "",
        scheduledStartTime: "",
        estimatedMinutes: "",
      }).success
    ).toBe(true);
  });

  it("accepts optional time-blocking metadata in the Task form", () => {
    const parsed = todayTaskFormSchema.safeParse({
      title: "Write the launch note",
      description: "",
      status: "todo",
      priority: "medium",
      isMit: false,
      dueDate: "2026-07-17",
      projectId: "",
      scheduledStartTime: "09:30",
      estimatedMinutes: "45",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        scheduledStartTime: "09:30",
        estimatedMinutes: 45,
      });
    }
  });

  it("keeps Focus Mode bounded to the top actionable tasks", () => {
    const focusTasks = getFocusModeTasks([
      { ...taskRecord, id: "mit", title: "MIT", status: "todo", priority: "high", isMit: true },
      { ...taskRecord, id: "doing", title: "Doing", status: "doing", priority: "medium", isMit: false },
      { ...taskRecord, id: "todo", title: "Todo", status: "todo", priority: "medium", isMit: false },
      { ...taskRecord, id: "done", title: "Done", status: "done", priority: "high", isMit: false },
      { ...taskRecord, id: "later", title: "Later", status: "deferred", priority: "high", isMit: false },
    ]);

    expect(focusTasks.map((task) => task.id)).toEqual(["mit", "doing", "todo"]);
  });

  it("renders an available linked Project and focused navigation", () => {
    const html = renderTodayUi(
      <TodayTaskCard
        task={taskRecord}
        linkedProject={projectRecord}
        isLinkedProjectLoading={false}
        {...taskActions}
      />
    );

    expect(html).toContain("Linked project");
    expect(html).toContain(projectRecord.title);
    expect(html).toContain('href="/projects?focusId=fixture-id"');
    expect(html).toContain("View project");
    expect(html).toContain("Done");
    expect(html).toContain("Delete");
  });

  it("keeps an orphaned Task usable without a cascade", () => {
    const html = renderTodayUi(
      <TodayTaskCard
        task={{ ...taskRecord, projectId: "deleted-project" }}
        isLinkedProjectLoading={false}
        {...taskActions}
      />
    );

    expect(html).toContain("Linked project unavailable");
    expect(html).not.toContain("View project");
    expect(html).toContain("Edit");
    expect(html).toContain("Delete");
  });

  it("renders loading and unavailable choices without dropping the current link", () => {
    const loadingCardHtml = renderTodayUi(
      <TodayTaskCard
        task={taskRecord}
        isLinkedProjectLoading
        {...taskActions}
      />
    );
    const unavailableFormHtml = renderTodayUi(
      <TodayTaskForm
        task={{ ...taskRecord, projectId: "deleted-project" }}
        projects={[]}
        isProjectsLoading={false}
        areProjectsUnavailable
        defaultDueDate="2026-07-17"
        isSubmitting={false}
        onSubmit={async () => undefined}
        onCancel={() => undefined}
      />
    );

    expect(loadingCardHtml).toContain("Loading projects…");
    expect(unavailableFormHtml).toContain(
      '<option value="deleted-project">Current linked project is unavailable</option>'
    );
    expect(unavailableFormHtml).toContain("The task remains usable");
  });

  it("keeps optional task form metadata behind a collapsed disclosure", () => {
    const html = renderTodayUi(
      <TodayTaskForm
        projects={[projectRecord]}
        isProjectsLoading={false}
        areProjectsUnavailable={false}
        defaultDueDate="2026-07-17"
        isSubmitting={false}
        onSubmit={async () => undefined}
        onCancel={() => undefined}
      />
    );

    expect(html).toContain("Task title");
    expect(html).toContain("Create task");
    expect(html).toContain('id="today-task-advanced-fields"');
    expect(html).toContain("Advanced task fields");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(
      'id="today-task-advanced-fields-content" hidden="" aria-hidden="true"'
    );
    expect(html).toContain("Linked project");
    expect(html).toContain("Repeat");
    expect(html).toContain("Start time");
    expect(html).toContain("Estimated duration");
  });

  it("keeps the optional time-blocking timeline collapsed while showing scheduled tasks", () => {
    const html = renderTodayUi(
      <TodayTimeBlockingTimeline
        tasks={[
          {
            ...taskRecord,
            title: "Focused writing block",
            scheduledStartTime: "09:30",
            estimatedMinutes: 45,
          },
        ]}
      />
    );

    expect(html).toContain('id="today-time-blocking"');
    expect(html).toContain("Time blocks");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="today-time-blocking-content" hidden="" aria-hidden="true"');
    expect(html).toContain("Focused writing block");
    expect(html).toContain("09:30");
    expect(html).toContain("45m planned");
  });

  it("keeps the weekly planning detail collapsed while showing its status summary", () => {
    const html = renderTodayUi(
      <TodayWeeklyPlanCard
        isLoading={false}
        focus={{
          plan: {
            id: "weekly-plan",
            weekStart: "2026-07-13",
            focusTitle: "Ship a calmer Today workspace",
            intention: "Use the plan as context, not another task list.",
            createdAt: "2026-07-13T08:00:00.000Z",
            updatedAt: "2026-07-13T08:00:00.000Z",
          },
          linkedTaskTotal: 3,
          linkedTaskCompleted: 1,
        }}
      />
    );

    expect(html).toContain('id="today-weekly-plan"');
    expect(html).toContain("Weekly plan focus");
    expect(html).toContain("Ship a calmer Today workspace");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="today-weekly-plan-content" hidden="" aria-hidden="true"');
    expect(html).toContain("1 / 3");
    expect(html).toContain("Weekly Review");
  });

  it("renders the linked Project controls in Persian", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const html = renderTodayUi(
      <TodayTaskCard
        task={taskRecord}
        linkedProject={projectRecord}
        isLinkedProjectLoading={false}
        {...taskActions}
      />
    );

    expect(html).toContain("پروژه مرتبط");
    expect(html).toContain("مشاهده پروژه");
  });
  it("keeps secondary Today side panels collapsed while preserving the primary task action", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/today/components/TodayWorkspace.tsx"),
      "utf8"
    );

    expect(source).toContain('id="today-routine-suggestions"');
    expect(source).toContain('id="today-daily-checkin"');
    expect(source).toContain('id="today-daily-insights"');
    expect(source.match(/defaultOpen={false}/g)?.length).toBeGreaterThanOrEqual(3);
    expect(source).toContain("openCreateTask");
    expect(source).toContain('t("today.newTask")');
  });
});
