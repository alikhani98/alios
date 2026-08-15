import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, knowledgeItemRecord, projectRecord } from "@/test/factories";

import { KnowledgeItemCard } from "../components/KnowledgeItemCard";

function renderKnowledgeCard(
  props: Partial<Parameters<typeof KnowledgeItemCard>[0]> = {}
): string {
  return renderToStaticMarkup(
    <StaticRouter location="/knowledge">
      <I18nProvider>
        <KnowledgeItemCard
          item={knowledgeItemRecord}
          isDeleting={false}
          onEdit={() => undefined}
          onDelete={async () => undefined}
          {...props}
        />
      </I18nProvider>
    </StaticRouter>
  );
}

describe("Knowledge structural links", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("renders linked Project and Goal context without affecting wikilinks", () => {
    const markup = renderKnowledgeCard({
      item: {
        ...knowledgeItemRecord,
        content: "Use [[Testing rule]] as a reference.",
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
    expect(markup).toContain("[[Testing rule]]");
  });

  it("keeps orphaned Project and Goal links non-destructive", () => {
    const markup = renderKnowledgeCard({
      item: {
        ...knowledgeItemRecord,
        projectId: "deleted-project",
        goalId: "deleted-goal",
      },
    });

    expect(markup).toContain("Linked project unavailable");
    expect(markup).toContain("Linked goal unavailable");
    expect(markup).toContain("Edit");
  });
});
