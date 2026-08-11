import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GoalCard, GoalForm } from "@/features/goals";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord } from "@/test/factories";

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
