import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GoalCard, GoalForm } from "@/features/goals";
import type { GoalLearningContext } from "../learningContext";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  decisionLogRecord,
  goalRecord,
  journalEntryRecord,
  knowledgeItemRecord,
} from "@/test/factories";

function renderGoalCard(
  overrides: Partial<ComponentProps<typeof GoalCard>> = {}
): string {
  return renderToStaticMarkup(
    <StaticRouter location="/goals">
      <I18nProvider>
        <DateDisplayProvider>
          <GoalCard
            goal={goalRecord}
            isReviewDue={false}
            isDeleting={false}
            onEdit={() => undefined}
            onDelete={() => undefined}
            onMarkReviewed={() => undefined}
            onMarkCompleted={() => undefined}
            onReactivate={() => undefined}
            {...overrides}
          />
        </DateDisplayProvider>
      </I18nProvider>
    </StaticRouter>
  );
}

function renderGoalForm(): string {
  return renderToStaticMarkup(
    <I18nProvider>
      <GoalForm
        goal={goalRecord}
        isSubmitting={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />
    </I18nProvider>
  );
}

function countOccurrences(text: string, phrase: string): number {
  return text.split(phrase).length - 1;
}

describe("Goals disclosure density", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("keeps goal cards focused while secondary details stay collapsed and reachable", () => {
    const markup = renderGoalCard();

    expect(markup).toContain("Improve sleep");
    expect(markup).toContain("35%");
    expect(markup).toContain("View life area");
    expect(markup).toContain("Edit");
    expect(markup).toContain("Mark completed");
    expect(markup).toContain("Goal details");
    expect(markup).toContain('id="goal-fixture-id-details-content" hidden="" aria-hidden="true"');
    expect(countOccurrences(markup, "Keep a regular bedtime and morning routine.")).toBe(1);
    expect(markup).toContain("Target date");
    expect(markup).toContain("Tags");
  });

  it("can display progress from linked work without removing the manual fallback", () => {
    const markup = renderGoalCard({
      useAutoProgress: true,
      projectProgress: {
        projectCount: 1,
        completedProjectCount: 0,
        taskCount: 4,
        completedTaskCount: 2,
        completionPercent: 50,
      },
      onAutoProgressChange: () => undefined,
    });

    expect(markup).toContain("Calculate progress from linked work");
    expect(markup).toContain("Auto: 50% from linked projects and tasks.");
    expect(markup).toContain("50%");
    expect(markup).not.toContain("Auto: 35%");
  });

  it("keeps auto progress unavailable when the goal has no linked work", () => {
    const markup = renderGoalCard({
      useAutoProgress: true,
      projectProgress: {
        projectCount: 0,
        completedProjectCount: 0,
        taskCount: 0,
        completedTaskCount: 0,
        completionPercent: null,
      },
      onAutoProgressChange: () => undefined,
    });

    expect(markup).toContain("Link projects or tasks to use auto progress.");
    expect(markup).toContain("35%");
  });

  it("renders related Journal, Decision, and Knowledge records only when linked", () => {
    const unlinkedMarkup = renderGoalCard();
    const linkedMarkup = renderGoalCard({
      linkedJournalEntries: [{ ...journalEntryRecord, goalId: goalRecord.id }],
      linkedDecisions: [{ ...decisionLogRecord, goalId: goalRecord.id }],
      linkedKnowledgeItems: [{ ...knowledgeItemRecord, goalId: goalRecord.id }],
    });

    expect(unlinkedMarkup).not.toContain("Related journal entries");
    expect(linkedMarkup).toContain("Related journal entries");
    expect(linkedMarkup).toContain(journalEntryRecord.title);
    expect(linkedMarkup).toContain("Related decisions");
    expect(linkedMarkup).toContain(decisionLogRecord.title);
    expect(linkedMarkup).toContain("Related Knowledge notes");
    expect(linkedMarkup).toContain(knowledgeItemRecord.title);
  });

  it("renders the learning context and keeps progress signals separate", () => {
    const learningContext: GoalLearningContext = {
      relatedResources: [
        { id: "resource-1", title: "SQL course", provenance: "project" },
      ],
      relatedProjects: [
        { id: "project-1", title: "Data practice", provenance: "direct" },
      ],
      relatedTasks: [
        { id: "task-1", title: "Practice joins", provenance: "project" },
      ],
      relatedKnowledge: [
        { id: "knowledge-1", title: "SQL joins", provenance: "knowledge" },
      ],
      progressSignals: {
        goalProgress: 35,
        projectCompletion: { completed: 1, total: 2, percent: 50 },
        taskCompletion: { completed: 3, total: 5, percent: 60 },
        resourceProgress: { tracked: 1, total: 2, averagePercent: 40 },
        knowledgeCount: 1,
      },
    };

    const markup = renderGoalCard({ learningContext });

    expect(markup).toContain("Learning context");
    expect(markup).toContain("SQL course");
    expect(markup).toContain("Through project");
    expect(markup).toContain("Data practice");
    expect(markup).toContain("Practice joins");
    expect(markup).toContain("SQL joins");
    expect(markup).toContain("Progress signals");
    expect(markup).toContain("Goal progress");
    expect(markup).toContain("Project completion");
    expect(markup).toContain("Task completion");
    expect(markup).toContain("Resource progress");
    expect(markup).toContain("Knowledge count");
    expect(markup).not.toContain("learning score");
  });

  it("keeps advanced goal form metadata collapsed without removing fields from the form", () => {
    const markup = renderGoalForm();

    expect(markup).toContain("Title");
    expect(markup).toContain("Description");
    expect(markup).toContain("Progress");
    expect(markup).toContain("Save goal");
    expect(markup).toContain("Advanced fields");
    expect(markup).toContain('id="goals-form-advanced-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('name="targetDate"');
    expect(markup).toContain('name="reviewIntervalDays"');
    expect(markup).toContain('name="tagsText"');
  });
});
