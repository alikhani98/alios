import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, lifeAreaRecord } from "@/test/factories";

vi.mock("../hooks/useLifeAreas", () => ({
  useLifeAreas: () => ({
    areas: [
      {
        ...lifeAreaRecord,
        id: "health",
        areaKey: "health",
        isPersisted: true,
        isCanonical: false,
        focusNote: "Protect evening recovery.",
        tags: ["health"],
      },
    ],
    isLoading: false,
    error: null,
    loadLifeAreas: async () => undefined,
    upsertArea: async () => undefined,
    deleteArea: async () => undefined,
    markReviewed: async () => undefined,
  }),
}));

vi.mock("@/features/goals/hooks/useGoals", () => ({
  useGoals: () => ({
    entries: [
      {
        ...goalRecord,
        id: "goal-health",
        area: "health",
        status: "active",
        progressPercent: 40,
      },
    ],
    isLoading: false,
    error: null,
    loadGoals: async () => undefined,
  }),
}));

import { LifeAreasPage } from "../pages/LifeAreasPage";

function renderPage(): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={["/life-areas"]}>
      <I18nProvider>
        <DateDisplayProvider>
          <LifeAreasPage />
        </DateDisplayProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe("LifeAreasPage density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps core life-area controls direct while secondary detail bands are collapsed", () => {
    const markup = renderPage();

    expect(markup).toContain("Life Areas");
    expect(markup).toContain("Total areas");
    expect(markup).toContain("Search life areas");
    expect(markup).toContain("View area goals");
    expect(markup).toContain("Edit");
    expect(markup).toContain("Mark reviewed");
    expect(markup).toContain("Area details");

    expect(markup).toContain('id="life-areas-editor-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="life-areas-canonical-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="life-area-health-details-content" hidden="" aria-hidden="true"');
  });
});
