import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";

import { ViewDensityModeControl } from "../pages/SettingsPage";

function renderControlToStaticMarkup() {
  return renderToStaticMarkup(
    <I18nProvider>
      <ViewDensityModeControl />
    </I18nProvider>
  );
}

describe("ViewDensityModeControl", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders an accessible bilingual density control with Full View selected by default", () => {
    const markup = renderControlToStaticMarkup();

    expect(markup).toContain("aria-label=\"View density\"");
    expect(markup).toContain("Full View");
    expect(markup).toContain("Simple View");
    expect(markup).toContain("checked=\"\"");
    expect(markup).toContain("Active mode");
    expect(markup).toContain("Reset to Full View");
  });

  it("renders a saved Simple View preference without changing the storage key", () => {
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");

    const markup = renderControlToStaticMarkup();

    expect(markup).toMatch(/checked="" value="simple"|value="simple" checked=""/);
    expect(markup).toContain("Active mode: Simple View");
  });

  it("renders the Persian label required for the settings surface", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = renderControlToStaticMarkup();

    expect(markup).toContain("تراکم نمایش");
    expect(markup).toContain("نمای کامل");
    expect(markup).toContain("نمای ساده");
  });
});
