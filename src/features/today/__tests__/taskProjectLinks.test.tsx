import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { projectRecord, taskRecord } from "@/test/factories";

import { TodayTaskCard } from "../components/TodayTaskCard";
import { TodayTaskForm } from "../components/TodayTaskForm";
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
      }).success
    ).toBe(true);
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
});
