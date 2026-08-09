// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

async function waitForElement(container: HTMLElement, selector: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const element = container.querySelector(selector);
    if (element) {
      return element;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  return container.querySelector(selector);
}

async function renderRoute(hashPath: string) {
  vi.resetModules();
  window.history.replaceState(null, "", `/#${hashPath}`);

  vi.doMock("@/shared/layout", async () => {
    const { Outlet } =
      await vi.importActual<typeof import("react-router-dom")>(
        "react-router-dom"
      );

    return {
      AppShell: () => (
        <main data-testid="app-shell">
          <Outlet />
        </main>
      ),
    };
  });
  vi.doMock("@/shared/ui", () => ({
    RouteLoadingFallback: () => <div data-testid="route-loading">Loading</div>,
  }));
  vi.doMock("@/features/home/pages/UnifiedHomePage", () => ({
    UnifiedHomePage: () => (
      <section data-testid="unified-home-page">Unified Home</section>
    ),
  }));
  vi.doMock("@/features/today/pages/TodayPage", async () => {
    const { useSearchParams } =
      await vi.importActual<typeof import("react-router-dom")>(
        "react-router-dom"
      );

    return {
      TodayPage: () => {
        const [searchParams] = useSearchParams();

        return (
          <section data-testid="today-page">
            Today Page
            <span data-testid="today-date">{searchParams.get("date")}</span>
            <span data-testid="today-focus">{searchParams.get("focusId")}</span>
            <span data-testid="today-goal">{searchParams.get("goalId")}</span>
            <span data-testid="today-project">
              {searchParams.get("projectId")}
            </span>
            <span data-testid="today-routine">
              {searchParams.get("routineId")}
            </span>
          </section>
        );
      },
    };
  });

  const { AppRouter } = await import("../router");
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);

  await act(async () => {
    root.render(<AppRouter />);
  });
  await act(async () => {
    await Promise.resolve();
  });

  return { container, root };
}

describe("AppRouter IA consolidation", () => {
  const roots: Root[] = [];
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) {
      act(() => {
        root.unmount();
      });
    }
    for (const container of containers.splice(0)) {
      container.remove();
    }
    vi.doUnmock("@/shared/layout");
    vi.doUnmock("@/shared/ui");
    vi.doUnmock("@/features/home/pages/UnifiedHomePage");
    vi.doUnmock("@/features/today/pages/TodayPage");
  });

  it("renders Unified Home at the main route", async () => {
    const rendered = await renderRoute("/");
    roots.push(rendered.root);
    containers.push(rendered.container);

    expect(await waitForElement(rendered.container, '[data-testid="unified-home-page"]')).not.toBeNull();
  });

  it("keeps the standalone Today route and its query parameters alive", async () => {
    const rendered = await renderRoute(
      "/today?date=2026-08-09&focusId=task-1&goalId=goal-1&projectId=project-1&routineId=routine-1"
    );
    roots.push(rendered.root);
    containers.push(rendered.container);

    expect(await waitForElement(rendered.container, '[data-testid="today-page"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-testid="today-date"]')?.textContent).toBe("2026-08-09");
    expect(rendered.container.querySelector('[data-testid="today-focus"]')?.textContent).toBe("task-1");
    expect(rendered.container.querySelector('[data-testid="today-goal"]')?.textContent).toBe("goal-1");
    expect(rendered.container.querySelector('[data-testid="today-project"]')?.textContent).toBe("project-1");
    expect(rendered.container.querySelector('[data-testid="today-routine"]')?.textContent).toBe("routine-1");
  });

  it("does not expose the retired temporary preview route", async () => {
    const rendered = await renderRoute("/preview-unified-home");
    roots.push(rendered.root);
    containers.push(rendered.container);

    expect(rendered.container.querySelector('[data-testid="unified-home-page"]')).toBeNull();
    expect(rendered.container.querySelector('[data-testid="today-page"]')).toBeNull();
    expect(rendered.container.textContent).toContain("404");
  });
});
