// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  goalRecord,
  knowledgeItemRecord,
  projectRecord,
  resourceRecord,
  taskRecord,
} from "@/test/factories";
import { ResourceDetailPage } from "../pages/ResourceDetailPage";

const mockAdapter = vi.hoisted(() => ({
  resources: { getById: vi.fn() },
  knowledge: { list: vi.fn() },
  goals: { list: vi.fn() },
  projects: { list: vi.fn() },
  tasks: { list: vi.fn() },
  attachments: { listByOwner: vi.fn() },
}));

vi.mock("@/core/storage", () => ({
  useStorageAdapter: () => mockAdapter,
}));

describe("ResourceDetailPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders resource details and derived related Knowledge", async () => {
    const resource = {
      ...resourceRecord,
      goalId: "goal-1",
      projectId: "project-1",
      taskId: "task-1",
    };
    const goal = { ...goalRecord, id: "goal-1", title: "CFA Preparation" };
    const derivedGoal = {
      ...goalRecord,
      id: "goal-from-knowledge",
      title: "Improve learning habit",
    };
    const project = {
      ...projectRecord,
      id: "project-1",
      title: "Learning project",
      goalId: goal.id,
    };
    const task = {
      ...taskRecord,
      id: "task-1",
      title: "Study chapter three",
      projectId: project.id,
    };

    mockAdapter.resources.getById.mockResolvedValue(resource);
    mockAdapter.knowledge.list.mockResolvedValue([
      {
        ...knowledgeItemRecord,
        resourceId: resource.id,
        goalId: derivedGoal.id,
      },
    ]);
    mockAdapter.goals.list.mockResolvedValue([goal, derivedGoal]);
    mockAdapter.projects.list.mockResolvedValue([project]);
    mockAdapter.tasks.list.mockResolvedValue([task]);
    mockAdapter.attachments.listByOwner.mockResolvedValue([
      {
        id: "resource-attachment",
        ownerType: "resource",
        ownerId: resource.id,
        kind: "document",
        filename: "atomic-habits.pdf",
        mimeType: "application/pdf",
        size: 2048,
        storageKey: "attachments/resource-attachment",
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      },
    ]);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/resources/${resource.id}`]}>
          <I18nProvider>
            <DateDisplayProvider>
              <Routes>
                <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
              </Routes>
            </DateDisplayProvider>
          </I18nProvider>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain(resource.title);
    expect(container.textContent).toContain("AliOS team");
    expect(container.textContent).toContain("Digital");
    expect(container.textContent).toContain("Related Knowledge");
    expect(container.textContent).toContain(knowledgeItemRecord.title);
    expect(container.textContent).toContain("Direct relationships");
    expect(container.textContent).toContain("CFA Preparation");
    expect(container.textContent).toContain("Learning project");
    expect(container.textContent).toContain("Study chapter three");
    expect(container.textContent).toContain("Derived context");
    expect(container.textContent).toContain("From: related Knowledge");
    expect(container.textContent).toContain("Learning context");
    expect(container.textContent).toContain("Goals supported");
    expect(container.textContent).toContain("Projects involved");
    expect(container.textContent).toContain("Tasks connected");
    expect(container.textContent).toContain("Knowledge created");
    expect(container.textContent).toContain("Source: Direct");
    expect(container.textContent).toContain("Source: Through Knowledge");
    expect(container.textContent).toContain("Add to Quick Access");
    expect(container.textContent).toContain("Create Knowledge Note");
    expect(container.textContent).toContain("Add attachment");
    expect(container.textContent).toContain("Attachments");
    expect(container.textContent).toContain("atomic-habits.pdf");
    expect(container.textContent).toContain("application/pdf");
    expect(mockAdapter.attachments.listByOwner).toHaveBeenCalledWith(
      "resource",
      resource.id
    );
    expect(
      container.querySelector(
        `a[href="/knowledge?create=1&resourceId=${resource.id}"]`
      )
    ).not.toBeNull();
  });

  it("renders unavailable labels for missing direct relationships", async () => {
    mockAdapter.resources.getById.mockResolvedValue({
      ...resourceRecord,
      goalId: "missing-goal",
      projectId: "missing-project",
      taskId: "missing-task",
    });
    mockAdapter.knowledge.list.mockResolvedValue([]);
    mockAdapter.goals.list.mockResolvedValue([]);
    mockAdapter.projects.list.mockResolvedValue([]);
    mockAdapter.tasks.list.mockResolvedValue([]);
    mockAdapter.attachments.listByOwner.mockResolvedValue([]);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/resources/${resourceRecord.id}`]}>
          <I18nProvider>
            <DateDisplayProvider>
              <Routes>
                <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
              </Routes>
            </DateDisplayProvider>
          </I18nProvider>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Linked goal unavailable");
    expect(container.textContent).toContain("Linked project unavailable");
    expect(container.textContent).toContain("Linked task unavailable");
    expect(container.textContent).toContain("Learning context");
    expect(container.textContent).toContain("No attachments yet");
  });

  it("renders a useful empty state for a missing resource", async () => {
    mockAdapter.resources.getById.mockResolvedValue(undefined);
    mockAdapter.knowledge.list.mockResolvedValue([]);
    mockAdapter.goals.list.mockResolvedValue([]);
    mockAdapter.projects.list.mockResolvedValue([]);
    mockAdapter.tasks.list.mockResolvedValue([]);
    mockAdapter.attachments.listByOwner.mockResolvedValue([]);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/resources/missing"]}>
          <I18nProvider>
            <DateDisplayProvider>
              <Routes>
                <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
              </Routes>
            </DateDisplayProvider>
          </I18nProvider>
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Resource not found");
    expect(container.textContent).toContain("Back to resources");
  });
});
