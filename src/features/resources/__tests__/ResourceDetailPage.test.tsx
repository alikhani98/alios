// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { knowledgeItemRecord, resourceRecord } from "@/test/factories";
import { ResourceDetailPage } from "../pages/ResourceDetailPage";

const mockAdapter = vi.hoisted(() => ({
  resources: { getById: vi.fn() },
  knowledge: { list: vi.fn() },
  goals: { list: vi.fn() },
  projects: { list: vi.fn() },
  tasks: { list: vi.fn() },
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
    mockAdapter.resources.getById.mockResolvedValue(resourceRecord);
    mockAdapter.knowledge.list.mockResolvedValue([
      { ...knowledgeItemRecord, resourceId: resourceRecord.id },
    ]);
    mockAdapter.goals.list.mockResolvedValue([]);
    mockAdapter.projects.list.mockResolvedValue([]);
    mockAdapter.tasks.list.mockResolvedValue([]);

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

    expect(container.textContent).toContain(resourceRecord.title);
    expect(container.textContent).toContain("AliOS team");
    expect(container.textContent).toContain("Digital");
    expect(container.textContent).toContain("Related Knowledge");
    expect(container.textContent).toContain(knowledgeItemRecord.title);
    expect(container.textContent).toContain("Add to Quick Access");
  });

  it("renders a useful empty state for a missing resource", async () => {
    mockAdapter.resources.getById.mockResolvedValue(undefined);
    mockAdapter.knowledge.list.mockResolvedValue([]);
    mockAdapter.goals.list.mockResolvedValue([]);
    mockAdapter.projects.list.mockResolvedValue([]);
    mockAdapter.tasks.list.mockResolvedValue([]);

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
