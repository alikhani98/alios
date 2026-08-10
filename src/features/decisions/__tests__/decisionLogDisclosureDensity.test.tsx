import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { DecisionLogEntry } from "@/shared/types";

import { DecisionLogCard } from "../components/DecisionLogCard";
import { DecisionLogForm } from "../components/DecisionLogForm";

const decision: DecisionLogEntry = {
  id: "decision-density",
  title: "Choose the calmer launch path",
  decisionDate: "2026-08-08",
  status: "decided",
  category: "Product",
  context: "The team needs a lower-risk release option.",
  options: ["Ship all changes", "Ship the stable subset"],
  chosenOption: "Ship the stable subset",
  reasoning: "It keeps the user-facing workflow steady.",
  expectedOutcome: "A smaller review surface.",
  reviewDate: "2026-08-15",
  actualOutcome: "The release stayed calm.",
  lesson: "Prefer the smallest reversible step.",
  confidence: 4,
  importance: 5,
  tags: ["release", "density"],
  createdAt: "2026-08-08T08:00:00.000Z",
  updatedAt: "2026-08-08T08:00:00.000Z",
};

function renderDecisionUi(element: ReactElement) {
  return renderToStaticMarkup(
    <I18nProvider>
      <DateDisplayProvider>{element}</DateDisplayProvider>
    </I18nProvider>
  );
}

describe("Decision Log disclosure density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps decision card scan content direct while long record details start collapsed", () => {
    const markup = renderDecisionUi(
      <DecisionLogCard
        decision={decision}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onMarkReviewed={async () => undefined}
        onArchive={async () => undefined}
      />
    );

    expect(markup).toContain("Choose the calmer launch path");
    expect(markup).toContain("Decided");
    expect(markup).toContain("Decision details");
    expect(markup).toContain('id="decision-details-decision-density"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain(
      'id="decision-details-decision-density-content" hidden="" aria-hidden="true"'
    );
    expect(markup).toContain("Ship the stable subset");
    expect(markup).toContain("Mark reviewed");
  });

  it("keeps the decision editor basics direct and secondary writing sections collapsed", () => {
    const markup = renderDecisionUi(
      <DecisionLogForm
        isSubmitting={false}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("Decision basics");
    expect(markup).toContain("Create decision");
    expect(markup).toContain('id="decision-log-basics"');
    expect(markup).toContain('id="decision-log-options"');
    expect(markup).toContain('id="decision-log-options-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="decision-log-review-content" hidden="" aria-hidden="true"');
  });

  it("keeps the page editor itself collapsed until the user chooses create or edit", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/decisions/pages/DecisionLogPage.tsx"),
      "utf8"
    );

    expect(source).toContain('id="decision-log-editor"');
    expect(source).toContain("open={isEditorOpen}");
    expect(source).toContain("setIsEditorOpen(true)");
  });
});
