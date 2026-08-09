import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, projectRecord, taskRecord } from "@/test/factories";

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
    expect(markup).toContain("Project density review");
    expect(markup).toContain("Edit");
    expect(markup).toContain("Project details");
    expect(markup).toContain('id="project-project-density-details-content" hidden="" aria-hidden="true"');
    expect(markup).not.toContain("Create project");
    expect(markup).not.toContain('id="project-title"');
  });
});
