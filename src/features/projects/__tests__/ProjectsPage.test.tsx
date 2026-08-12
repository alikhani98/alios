import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, projectRecord, taskRecord } from "@/test/factories";
import { ProjectKanbanBoard, groupProjectsByStatus } from "../components/ProjectKanbanBoard";

vi.mock("@/core/storage", () => ({
  useStorageAdapter: () => ({
    tasks: {
      list: async () => [taskRecord],
    },
  }),
}));

vi.mock("../hooks/useProjects", () => ({
  useProjects: () => ({
    projects: [
      {
        ...projectRecord,
        id: "project-density",
        title: "Project density review",
      },
    ],
    isLoading: false,
    error: null,
    loadProjects: async () => undefined,
    createProject: async () => undefined,
    updateProject: async () => undefined,
    deleteProject: async () => undefined,
  }),
}));

vi.mock("@/features/goals/hooks/useGoals", () => ({
  useGoals: () => ({
    entries: [goalRecord],
    isLoading: false,
    error: null,
    loadGoals: async () => undefined,
  }),
}));

import { ProjectsPage } from "../pages/ProjectsPage";

function renderPage(): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={["/projects"]}>
      <I18nProvider>
        <DateDisplayProvider>
          <ProjectsPage />
        </DateDisplayProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe("ProjectsPage density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps the primary project action direct while project forms and details stay collapsed by default", () => {
    const markup = renderPage();

    expect(markup).toContain("New project");
    expect(markup).toContain("List");
    expect(markup).toContain("Kanban");
    expect(markup).toContain("Project density review");
    expect(markup).toContain("Edit");
    expect(markup).toContain("Project details");
    expect(markup).toContain('id="project-project-density-details-content" hidden="" aria-hidden="true"');
    expect(markup).not.toContain("Create project");
    expect(markup).not.toContain('id="project-title"');
  });

  it("groups every existing project status into the Kanban board without inventing new statuses", () => {
    const projects = [
      { ...projectRecord, id: "project-active", title: "Active project", status: "active" as const },
      { ...projectRecord, id: "project-waiting", title: "Waiting project", status: "waiting" as const },
      { ...projectRecord, id: "project-later", title: "Later project", status: "later" as const },
      { ...projectRecord, id: "project-completed", title: "Completed project", status: "completed" as const },
      { ...projectRecord, id: "project-archived", title: "Archived project", status: "archived" as const },
    ];

    const grouped = groupProjectsByStatus(projects);
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <I18nProvider>
          <ProjectKanbanBoard
            draggedProjectId={null}
            onDragEnd={() => undefined}
            onDragStart={() => undefined}
            onEditProject={() => undefined}
            onStatusChange={() => undefined}
            projects={projects}
          />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(grouped.map((group) => group.status)).toEqual([
      "active",
      "waiting",
      "later",
      "completed",
      "archived",
    ]);
    expect(markup).toContain("Project Kanban board");
    expect(markup).toContain("Active project");
    expect(markup).toContain("Waiting project");
    expect(markup).toContain("Later project");
    expect(markup).toContain("Completed project");
    expect(markup).toContain("Archived project");
  });
});
