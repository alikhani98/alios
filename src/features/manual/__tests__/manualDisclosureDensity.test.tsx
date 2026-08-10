import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { ManualEntryCard } from "@/features/manual/components/ManualEntryCard";
import { ManualEntryForm } from "@/features/manual/components/ManualEntryForm";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { manualEntryRecord } from "@/test/factories";

function renderManualCard(): string {
  return renderToStaticMarkup(
    <StaticRouter location="/manual">
      <I18nProvider>
        <DateDisplayProvider>
          <ManualEntryCard
            entry={manualEntryRecord}
            isDeleting={false}
            onEdit={() => undefined}
            onDelete={async () => undefined}
            onMarkReviewed={async () => undefined}
          />
        </DateDisplayProvider>
      </I18nProvider>
    </StaticRouter>
  );
}

function renderManualForm(): string {
  return renderToStaticMarkup(
    <I18nProvider>
      <ManualEntryForm
        entry={manualEntryRecord}
        isSubmitting={false}
        onSubmit={async () => undefined}
        onCancel={() => undefined}
      />
    </I18nProvider>
  );
}

function countOccurrences(text: string, phrase: string): number {
  return text.split(phrase).length - 1;
}

describe("Personal Manual disclosure density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps manual cards focused while full notes and metadata stay collapsed", () => {
    const markup = renderManualCard();

    expect(markup).toContain("Personal planning rule");
    expect(markup).toContain("Principles");
    expect(markup).toContain("Edit");
    expect(markup).toContain("Mark reviewed");
    expect(markup).toContain("Entry details");
    expect(markup).toContain('id="manual-entry-fixture-id-details-content" hidden="" aria-hidden="true"');
    expect(countOccurrences(markup, "Keep the next action small and local when energy is low.")).toBe(1);
    expect(markup).toContain("Updated at");
    expect(markup).toContain("Tags");
  });

  it("keeps optional manual form fields collapsed without removing them from submission", () => {
    const markup = renderManualForm();

    expect(markup).toContain("Title");
    expect(markup).toContain("Content");
    expect(markup).toContain("Status");
    expect(markup).toContain("Advanced fields");
    expect(markup).toContain('id="manual-entry-form-advanced-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('name="reviewIntervalDays"');
    expect(markup).toContain('name="tagsText"');
  });
});
