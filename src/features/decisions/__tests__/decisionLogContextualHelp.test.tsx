import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { DecisionLogContextualHelp } from "../pages/DecisionLogPage";

function renderHelp(isOpen: boolean) {
  return renderToStaticMarkup(
    <I18nProvider>
      <DecisionLogContextualHelp
        isOpen={isOpen}
        onToggle={vi.fn()}
        panelId="decision-log-help-test"
      />
    </I18nProvider>
  );
}

describe("DecisionLogContextualHelp", () => {
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
    expect(markup).toContain("aria-label=\"Help for Decision Log\"");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("aria-controls=\"decision-log-help-test\"");
    expect(markup).toContain("Help");
    expect(markup).not.toContain("What to record here");
  });

  it("reveals the local-first non-advisory guidance when expanded", () => {
    const markup = renderHelp(true);

    expect(markup).toContain("aria-expanded=\"true\"");
    expect(markup).toContain("role=\"note\"");
    expect(markup).toContain("What to record here");
    expect(markup).toContain("tradeoffs or options");
    expect(markup).toContain("Decisions stay on this device");
    expect(markup).toContain("it does not decide for you");
  });

  it("uses Persian help labels when the app language is Persian", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = renderHelp(false);

    expect(markup).toContain("راهنما");
    expect(markup).toContain("راهنمای دفترچه تصمیم‌ها");
  });
});
