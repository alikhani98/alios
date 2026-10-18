// @vitest-environment jsdom
import { format } from "date-fns";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import { taskRecord } from "@/test/factories";
import { CalendarPage } from "../pages/CalendarPage";

const repository = vi.hoisted(() => ({ tasks: { list: vi.fn() } }));
vi.mock("@/core/storage", () => ({ useStorageAdapter: () => repository }));

function pendingTasks() {
  let resolve!: (tasks: Task[]) => void;
  const promise = new Promise<Task[]>((done) => { resolve = done; });
  return { promise, resolve };
}

describe.each([
  { language: "en", loading: "Loading", empty: "No tasks are planned for this day.", error: "The calendar could not be loaded from local storage." },
  { language: "fa", loading: "در حال بارگذاری", empty: "برای این روز کاری برنامه‌ریزی نشده است.", error: "تقویم از داده‌های محلی بارگذاری نشد." },
])("Calendar data states ($language)", ({ language, loading, empty, error }) => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    repository.tasks.list.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  async function renderPage() {
    await act(async () => root.render(
      <MemoryRouter>
        <I18nProvider>
          <DateDisplayProvider><CalendarPage /></DateDisplayProvider>
        </I18nProvider>
      </MemoryRouter>
    ));
  }

  it.each([false, true])("shows loading before a confirmed result (populated: %s)", async (populated) => {
    const pending = pendingTasks();
    repository.tasks.list.mockReturnValue(pending.promise);
    await renderPage();

    const details = container.querySelector(".calendar-details-content");
    expect(details?.querySelector("[role='status']")?.textContent).toContain(loading);
    expect(details?.textContent).not.toContain(empty);
    expect(container.querySelector(".calendar-grid-content")?.getAttribute("aria-busy")).toBe("true");
    const skeleton = container.querySelector(".calendar-grid-content [aria-hidden='true']");
    expect(skeleton?.classList.contains("motion-safe:animate-pulse")).toBe(true);
    expect(skeleton?.classList.contains("animate-pulse")).toBe(false);

    await act(async () => pending.resolve(populated ? [{
      ...taskRecord, title: "Scheduled task", dueDate: format(new Date(), "yyyy-MM-dd"),
    }] : []));

    expect(container.querySelector(".calendar-grid-content")?.getAttribute("aria-busy")).toBe("false");
    expect(details?.querySelector("[role='status']")).toBeNull();
    expect(details?.textContent).toContain(populated ? "Scheduled task" : empty);
    expect(container.querySelectorAll(".calendar-month-date")).toHaveLength(42);
  });

  it("keeps failure distinct from an empty day through retry and recovery", async () => {
    repository.tasks.list.mockRejectedValueOnce(new Error("Unavailable storage"));
    await renderPage();
    const details = container.querySelector(".calendar-details-content");
    expect(details?.querySelector("[role='status']")?.textContent).toBe(error);
    expect(details?.textContent).not.toContain(empty);

    const retry = container.querySelector<HTMLButtonElement>(".calendar-grid-content button");
    expect(retry).not.toBeNull();
    const pending = pendingTasks();
    repository.tasks.list.mockReturnValueOnce(pending.promise);
    await act(async () => retry?.click());
    expect(details?.querySelector("[role='status']")?.textContent).toContain(loading);
    expect(details?.textContent).not.toContain(empty);

    await act(async () => pending.resolve([]));
    expect(details?.textContent).toBe(empty);
    expect(repository.tasks.list).toHaveBeenCalledTimes(2);
  });
});
