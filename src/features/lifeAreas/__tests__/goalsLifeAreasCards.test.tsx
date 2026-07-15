import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GoalCard } from "@/features/goals";
import { DateDisplayProvider } from "@/shared/date";
import {
  I18nProvider,
  LANGUAGE_STORAGE_KEY,
} from "@/shared/i18n";
import { goalRecord, lifeAreaRecord } from "@/test/factories";

import { LifeAreaCard } from "../components/LifeAreaCard";

function renderCard(card: ReactElement, location: string): string {
  return renderToStaticMarkup(
    <StaticRouter location={location}>
      <I18nProvider>
        <DateDisplayProvider>{card}</DateDisplayProvider>
      </I18nProvider>
    </StaticRouter>
  );
}

describe("Goals and Life Areas cards", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("renders a goal link to its focused Life Area with mobile-safe actions", () => {
    const html = renderCard(
      <GoalCard
        goal={{
          ...goalRecord,
          title: "A deliberately long health goal title that must wrap safely",
          description:
            "Keep a deliberately long description readable without widening the page.",
          tags: ["a-deliberately-long-goal-tag-that-must-wrap"],
        }}
        isReviewDue={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onMarkReviewed={() => undefined}
        onMarkCompleted={() => undefined}
        onReactivate={() => undefined}
      />,
      "/goals?area=health"
    );

    expect(html).toContain('href="/life-areas?focusId=health"');
    expect(html).toContain("View life area");
    expect(html).toContain("w-full sm:w-auto");
    expect(html).toContain("break-words whitespace-normal");
  });

  it("renders a Life Area summary and its filtered Goals link", () => {
    const html = renderCard(
      <LifeAreaCard
        area={{
          ...lifeAreaRecord,
          isPersisted: true,
          isCanonical: false,
        }}
        goalSummary={{
          totalCount: 4,
          activeCount: 2,
          completedCount: 1,
          averageActiveProgress: 45,
        }}
        isGoalSummaryLoading={false}
        isGoalSummaryUnavailable={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onMarkReviewed={async () => undefined}
      />,
      "/life-areas?focusId=health"
    );

    expect(html).toContain("Linked goals");
    expect(html).toContain("Active: 2");
    expect(html).toContain("Completed: 1");
    expect(html).toContain("Active progress: 45%");
    expect(html).toContain('href="/goals?area=health"');
    expect(html).toContain("View area goals");
  });

  it("keeps Life Areas usable while linked goal summaries are unavailable", () => {
    const html = renderCard(
      <LifeAreaCard
        area={{
          ...lifeAreaRecord,
          isPersisted: true,
          isCanonical: false,
        }}
        goalSummary={{
          totalCount: 0,
          activeCount: 0,
          completedCount: 0,
          averageActiveProgress: null,
        }}
        isGoalSummaryLoading={false}
        isGoalSummaryUnavailable
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onMarkReviewed={async () => undefined}
      />,
      "/life-areas"
    );

    expect(html).toContain("Unavailable");
    expect(html).not.toContain("Active: 0");
    expect(html).toContain("Edit");
    expect(html).toContain("Mark reviewed");
  });

  it("does not render partial linked-goal details while they are loading", () => {
    const html = renderCard(
      <LifeAreaCard
        area={{
          ...lifeAreaRecord,
          isPersisted: true,
          isCanonical: false,
        }}
        goalSummary={{
          totalCount: 4,
          activeCount: 2,
          completedCount: 1,
          averageActiveProgress: 45,
        }}
        isGoalSummaryLoading
        isGoalSummaryUnavailable={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onMarkReviewed={async () => undefined}
      />,
      "/life-areas"
    );

    expect(html).toContain("Loading");
    expect(html).not.toContain("Active: 2");
    expect(html).not.toContain("Completed: 1");
  });

  it("renders the two-way connection labels in Persian", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const goalHtml = renderCard(
      <GoalCard
        goal={goalRecord}
        isReviewDue={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onMarkReviewed={() => undefined}
        onMarkCompleted={() => undefined}
        onReactivate={() => undefined}
      />,
      "/goals"
    );

    const areaHtml = renderCard(
      <LifeAreaCard
        area={{ ...lifeAreaRecord, isPersisted: true, isCanonical: false }}
        goalSummary={{
          totalCount: 1,
          activeCount: 1,
          completedCount: 0,
          averageActiveProgress: 35,
        }}
        isGoalSummaryLoading={false}
        isGoalSummaryUnavailable={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onMarkReviewed={async () => undefined}
      />,
      "/life-areas"
    );

    expect(goalHtml).toContain("مشاهده حوزه زندگی");
    expect(areaHtml).toContain("هدف‌های مرتبط");
    expect(areaHtml).toContain("مشاهده هدف‌های این حوزه");
  });
});
