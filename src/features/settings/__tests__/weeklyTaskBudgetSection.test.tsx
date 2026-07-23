import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { WEEKLY_TASK_BUDGET_STORAGE_KEY } from "@/shared/preferences/weeklyTaskBudget";

import { WeeklyTaskBudgetSection } from "../components/WeeklyTaskBudgetSection";

function renderSection() {
  return renderToStaticMarkup(
    <I18nProvider>
      <WeeklyTaskBudgetSection />
    </I18nProvider>
  );
}

describe("weekly task budget settings section", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("renders the not-configured state with accessible field wiring", () => {
    const markup = renderSection();

    expect(markup).toContain("Weekly task budget");
    expect(markup).toContain("Tasks to plan per week");
    expect(markup).toContain("weekly-task-budget-input");
    expect(markup).toContain("weekly-task-budget-description");
    expect(markup).toContain("aria-describedby=\"weekly-task-budget-description\"");
    expect(markup).toContain("Not configured");
  });

  it("renders a stored valid budget without inventing a default", () => {
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "8");

    const markup = renderSection();

    expect(markup).toContain("value=\"8\"");
    expect(markup).toContain("8 task(s)/week");
  });

  it("normalizes invalid stored values back to not configured", () => {
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "0");

    const markup = renderSection();

    expect(markup).toContain("value=\"\"");
    expect(markup).toContain("Not configured");
  });

  it("does not render slider, chart, or smart-capacity language", () => {
    const markup = renderSection();

    expect(markup).not.toMatch(/slider|gauge|chart|smart capacity|ideal workload|productivity score/i);
    expect(markup).toContain("AliOS does not recommend this number");
  });
});
