import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { GoalsContextualHelp } from "../pages/GoalsPage";

function renderHelp(isOpen: boolean) {
  return renderToStaticMarkup(
    <I18nProvider>
      <GoalsContextualHelp
        isOpen={isOpen}
        onToggle={vi.fn()}
        panelId="goals-help-test"
      />
    </I18nProvider>
  );
}

describe("GoalsContextualHelp", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders an accessible click/tap trigger before the help content is expanded", () => {
    const markup = renderHelp(false);

    expect(markup).toContain("<button");
    expect(markup).toContain("aria-label=\"Help for Goals\"");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("aria-controls=\"goals-help-test\"");
    expect(markup).toContain("Help");
    expect(markup).not.toContain("How to use goals");
  });

  it("reveals local-first progress and priority guidance when expanded", () => {
    const markup = renderHelp(true);

    expect(markup).toContain("aria-expanded=\"true\"");
    expect(markup).toContain("role=\"note\"");
    expect(markup).toContain("How to use goals");
    expect(markup).toContain("clear, reviewable goals");
    expect(markup).toContain("does not fake progress");
    expect(markup).toContain("does not fake progress or decide priorities automatically");
    expect(markup).toContain("stay on this device");
  });

  it("uses Persian help labels when the app language is Persian", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = renderHelp(false);

    expect(markup).toContain("راهنما");
    expect(markup).toContain("راهنمای هدف‌ها");
  });

  it("keeps the primary goal action in the page source", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/goals/pages/GoalsPage.tsx"),
      "utf8"
    );

    expect(source).toContain('t("goals.newGoal")');
    expect(source).toContain("openCreateForm");
  });
});
