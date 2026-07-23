import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StorageAdapterProvider } from "@/core/storage";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { WEEKLY_TASK_BUDGET_STORAGE_KEY } from "@/shared/preferences/weeklyTaskBudget";

import { WeeklyTaskBudgetSection } from "../components/WeeklyTaskBudgetSection";

let database: AliosDatabase;
let storage: DexieStorageAdapter;

function renderSectionToStaticMarkup() {
  return renderToStaticMarkup(
    <I18nProvider>
      <StorageAdapterProvider adapter={storage}>
        <WeeklyTaskBudgetSection />
      </StorageAdapterProvider>
    </I18nProvider>
  );
}

describe("weekly task budget settings section", () => {
  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(async () => {
    await destroyTestDatabase(database);
    localStorage.clear();
  });

  it("renders the not-configured state with accessible field wiring", () => {
    const markup = renderSectionToStaticMarkup();

    expect(markup).toContain("Weekly task budget");
    expect(markup).toContain("Tasks to plan per week");
    expect(markup).toContain("weekly-task-budget-input");
    expect(markup).toContain("weekly-task-budget-description");
    expect(markup).toContain("aria-describedby=\"weekly-task-budget-description\"");
    expect(markup).toContain("Not configured");
    expect(markup).not.toContain("type=\"range\"");
    expect(markup).toContain("Unknown is not zero");
  });

  it("renders a stored valid budget without inventing a default", () => {
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "8");

    const markup = renderSectionToStaticMarkup();

    expect(markup).toContain("value=\"8\"");
    expect(markup).toContain("type=\"range\"");
    expect(markup).toContain("value=\"8\"");
    expect(markup).toContain("8 task(s)/week");
  });

  it("normalizes invalid stored values back to not configured", () => {
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "0");

    const markup = renderSectionToStaticMarkup();

    expect(markup).toContain("value=\"\"");
    expect(markup).toContain("Not configured");
  });

  it("renders slider and descriptive summary wiring for a configured draft", () => {
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "8");

    const markup = renderSectionToStaticMarkup();

    expect(markup).toContain("Budget slider");
    expect(markup).toContain("aria-valuemin=\"1\"");
    expect(markup).toContain("aria-valuemax=\"999\"");
    expect(markup).toContain("aria-valuenow=\"8\"");
    expect(markup).toContain("Use arrows, Home, or End");
    expect(markup).toContain("Weekly budget summary");
    expect(markup).toContain("Budget");
    expect(markup).toContain("Planned");
    expect(markup).toContain("Difference");
    expect(markup).not.toMatch(/capacity percentage|progress ring|gauge|ideal workload|risk score/i);
  });

  it("renders Persian slider copy through localization", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");
    localStorage.setItem(WEEKLY_TASK_BUDGET_STORAGE_KEY, "5");

    const markup = renderSectionToStaticMarkup();

    expect(markup).toContain("اسلایدر بودجه");
    expect(markup).toContain("پیش‌نویس");
    expect(markup).toContain("کار/هفته");
  });

  it("does not render chart, smart-capacity, or advisory language", () => {
    const markup = renderSectionToStaticMarkup();

    expect(markup).not.toMatch(/gauge|chart|smart capacity|ideal workload|productivity score|recommended budget|risk score/i);
    expect(markup).toContain("AliOS does not recommend this number");
  });
});
