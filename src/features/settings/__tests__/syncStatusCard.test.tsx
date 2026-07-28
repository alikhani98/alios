import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { SyncStatusCard } from "../components/SyncStatusCard";

function renderCardToStaticMarkup() {
  return renderToStaticMarkup(
    <I18nProvider>
      <SyncStatusCard onGoToBackupRestore={vi.fn()} />
    </I18nProvider>
  );
}

describe("SyncStatusCard", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders the local-only account and sync foundation with disabled future actions", () => {
    const markup = renderCardToStaticMarkup();

    expect(markup).toContain("Account &amp; Sync");
    expect(markup).toContain("Local only");
    expect(markup).toContain("Create account");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Enable sync");
    expect(markup).toContain("disabled=\"\"");
    expect(markup).toContain("Data stays on this device");
  });

  it("renders the Persian account and sync copy for the settings surface", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const markup = renderCardToStaticMarkup();

    expect(markup).toContain("حساب و همگام‌سازی");
    expect(markup).toContain("فقط محلی");
    expect(markup).toContain("ایجاد حساب");
    expect(markup).toContain("فعال‌کردن همگام‌سازی");
  });
});
