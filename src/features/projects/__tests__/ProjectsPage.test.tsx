// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, projectRecord, taskRecord } from "@/test/factories";
import { ProjectKanbanBoard, groupProjectsByStatus } from "../components/ProjectKanbanBoard";

const taskRepositoryMock = vi.hoisted(() => ({
  storage: {
    tasks: {
      list: vi.fn(),
    },
  },
}));

vi.mock("@/core/storage", () => ({
  useStorageAdapter: () => taskRepositoryMock.storage,
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

async function renderPageClient(): Promise<{
  container: HTMLDivElement;
  root: Root;
}> {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/projects"]}>
        <I18nProvider>
          <DateDisplayProvider>
            <ProjectsPage />
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

describe("ProjectsPage density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    taskRepositoryMock.storage.tasks.list.mockReset();
    taskRepositoryMock.storage.tasks.list.mockResolvedValue([taskRecord]);
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

  it("shows linked task load failures separately from the empty project state", async () => {
    taskRepositoryMock.storage.tasks.list.mockRejectedValueOnce(new Error("Task storage failed."));

    const { container, root } = await renderPageClient();

    try {
      expect(container.textContent).toContain("Project density review");
      expect(container.textContent).toContain(
        "Linked task progress could not be loaded. Your projects are still available."
      );
      expect(container.textContent).toContain("Try again");
      expect(container.textContent).not.toContain("No projects yet");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
