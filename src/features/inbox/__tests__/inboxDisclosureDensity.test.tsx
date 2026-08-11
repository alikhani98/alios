import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { InboxItem } from "@/shared/types";

import { InboxItemCard } from "../components/InboxItemCard";
import { InboxItemForm } from "../components/InboxItemForm";

function renderInboxForm() {
  return renderToStaticMarkup(
    <I18nProvider>
      <InboxItemForm
        isSubmitting={false}
        onSubmit={async () => true}
      />
    </I18nProvider>
  );
}

function renderInboxCard() {
  const item: InboxItem = {
    id: "inbox-one",
    content: "Process a captured idea",
    type: "idea",
    status: "unprocessed",
    createdAt: "2026-08-11T08:00:00.000Z",
    updatedAt: "2026-08-11T08:00:00.000Z",
  };

  return renderToStaticMarkup(
    <I18nProvider>
      <DateDisplayProvider>
        <InboxItemCard
          item={item}
          isBusy={false}
          isSelected={false}
          onSelectionChange={() => undefined}
          onEdit={async () => true}
          onToggleStatus={async () => undefined}
          onConvert={async () => undefined}
          onDelete={async () => undefined}
        />
      </DateDisplayProvider>
    </I18nProvider>
  );
}

describe("Inbox disclosure density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps quick capture direct while optional type metadata starts collapsed", () => {
    const markup = renderInboxForm();

    expect(markup).toContain("Capture item");
    expect(markup).toContain("Capture");
    expect(markup).toContain('id="inbox-type-details"');
    expect(markup).toContain("Capture details");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="inbox-type-details-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("Type");
  });

  it("adds mobile swipe affordances without removing tap-based inbox actions", () => {
    const markup = renderInboxCard();

    expect(markup).toContain("Process a captured idea");
    expect(markup).toContain("Process Inbox");
    expect(markup).toContain("Delete");
    expect(markup).toContain("Edit");
    expect(markup).toContain("md:hidden");
  });

  it("keeps search direct while advanced filters are behind a disclosure", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/inbox/pages/InboxPage.tsx"),
      "utf8"
    );

    expect(source).toContain('id="inbox-search-filters"');
    expect(source).toContain('title={t("inbox.filters")}');
    expect(source).toContain('defaultOpen={false}');
    expect(source).toContain('placeholder={t("inbox.searchPlaceholder")}');
    expect(source).toContain('value={searchQuery}');
  });
});
