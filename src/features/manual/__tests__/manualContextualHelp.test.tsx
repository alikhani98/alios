import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { ManualContextualHelp } from "../pages/PersonalManualPage";

function renderHelp(isOpen: boolean) {
  return renderToStaticMarkup(
    <I18nProvider>
      <ManualContextualHelp
        isOpen={isOpen}
        onToggle={vi.fn()}
        panelId="manual-help-test"
      />
    </I18nProvider>
  );
}

describe("ManualContextualHelp", () => {
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
    expect(markup).toContain("aria-label=\"Help for Personal Manual\"");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("aria-controls=\"manual-help-test\"");
    expect(markup).toContain("Help");
    expect(markup).not.toContain("What belongs here");
  });

  it("reveals the local-first non-inference guidance when expanded", () => {
    const markup = renderHelp(true);

    expect(markup).toContain("aria-expanded=\"true\"");
    expect(markup).toContain("role=\"note\"");
    expect(markup).toContain("What belongs here");
    expect(markup).toContain("personal operating instructions");
    expect(markup).toContain("does not infer private meaning automatically");
    expect(markup).toContain("stays on this device");
  });

  it("uses Persian help labels when the app language is Persian", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = renderHelp(false);

    expect(markup).toContain("راهنما");
    expect(markup).toContain("راهنمای دفترچه شخصی");
  });

  it("keeps the primary manual entry action in the page source", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/manual/pages/PersonalManualPage.tsx"),
      "utf8"
    );

    expect(source).toContain('t("manual.newEntry")');
    expect(source).toContain("openCreateForm");
  });
});
