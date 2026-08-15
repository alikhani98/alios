import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, journalEntryRecord, projectRecord } from "@/test/factories";

import { JournalEntryCard } from "../components/JournalEntryCard";

function renderJournalCard(
  props: Partial<Parameters<typeof JournalEntryCard>[0]> = {}
): string {
  return renderToStaticMarkup(
    <StaticRouter location="/journal">
      <I18nProvider>
        <DateDisplayProvider>
          <JournalEntryCard
            entry={journalEntryRecord}
            isDeleting={false}
            onEdit={() => undefined}
            onDelete={async () => undefined}
            {...props}
          />
        </DateDisplayProvider>
      </I18nProvider>
    </StaticRouter>
  );
}

describe("Journal structural links", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("renders linked Project and Goal context", () => {
    const markup = renderJournalCard({
      entry: {
        ...journalEntryRecord,
        projectId: projectRecord.id,
        goalId: goalRecord.id,
      },
      linkedProject: projectRecord,
      linkedGoal: goalRecord,
    });

    expect(markup).toContain("Linked project");
    expect(markup).toContain(projectRecord.title);
    expect(markup).toContain('href="/projects?focusId=fixture-id"');
    expect(markup).toContain(goalRecord.title);
    expect(markup).toContain('href="/goals?focusId=fixture-id"');
  });

  it("keeps orphaned Project and Goal links non-destructive", () => {
    const markup = renderJournalCard({
      entry: {
        ...journalEntryRecord,
        projectId: "deleted-project",
        goalId: "deleted-goal",
      },
    });

    expect(markup).toContain("Linked project unavailable");
    expect(markup).toContain("Linked goal unavailable");
    expect(markup).toContain("Edit");
  });
});
