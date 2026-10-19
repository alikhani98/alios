// @vitest-environment jsdom
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GoalCard } from "@/features/goals";
import { DateDisplayProvider } from "@/shared/date";
import {
  I18nProvider,
  LANGUAGE_STORAGE_KEY,
} from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
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

function Location() {
  const location = useLocation();
  return <output data-location>{location.pathname}{location.search}</output>;
}

describe("Goals and Life Areas cards", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;
  beforeEach(async () => {
    await loadMessages("en");
    await loadMessages("fa");
    localStorage.clear();
    window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });
  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    localStorage.clear();
    window.localStorage.clear();
  });
  async function renderInteractiveCard(card: ReactElement, location: string) {
    const host = document.createElement("div");
    container = host;
    document.body.appendChild(host);
    const mountedRoot = createRoot(host);
    root = mountedRoot;
    await act(async () => mountedRoot.render(
      <MemoryRouter initialEntries={[location]}><I18nProvider>
        <DateDisplayProvider>{card}<Location /></DateDisplayProvider>
      </I18nProvider></MemoryRouter>
    ));
    return host;
  }
  async function openGoalActions(host: HTMLDivElement, label: string) {
    const trigger = host.querySelector<HTMLButtonElement>(".goal-overflow > button");
    if (!trigger) throw new Error("Missing goal actions trigger");
    expect(trigger.getAttribute("aria-label")).toBe(label);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    return trigger;
  }

  it("renders a goal link to its focused Life Area with mobile-safe actions", async () => {
    const host = await renderInteractiveCard(
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

    expect(host.querySelector('a[href="/life-areas?focusId=health"]')).toBeNull();
    const trigger = await openGoalActions(host, messagesEn["command.quickActions"]);
    const link = Array.from(host.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .find((entry) => entry.textContent?.trim() === messagesEn["goals.openLifeArea"]);
    if (!link) throw new Error("Missing accessible Life Area link");
    expect(link.getAttribute("href")).toBe("/life-areas?focusId=health");
    expect(document.activeElement).toBe(link);
    expect(link.tabIndex).toBe(0);
    expect(host.querySelector(".goal-actions")?.classList.contains("flex-wrap")).toBe(true);
    for (const button of host.querySelectorAll(".goal-actions button")) {
      expect(button.classList.contains("w-full") || button.closest(".goal-overflow-panel") !== null).toBe(true);
    }
    expect(host.querySelector(".goal-card h3")?.classList.contains("break-words")).toBe(true);
    expect(host.querySelector(".goal-metadata .whitespace-normal")).not.toBeNull();
    await act(async () => link.click());
    expect(host.querySelector("[data-location]")?.textContent).toBe("/life-areas?focusId=health");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
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
    expect(html).toContain("Area details");
    expect(html).toContain("Active: 2");
    expect(html).toContain("Completed: 1");
    expect(html).toContain("Active progress: 45%");
    expect(html).toContain('id="life-area-health-details-content" hidden="" aria-hidden="true"');
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

  it("renders the two-way connection labels in Persian", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const goalHost = await renderInteractiveCard(
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

    await openGoalActions(goalHost, messagesFa["command.quickActions"]);
    const link = Array.from(goalHost.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .find((entry) => entry.textContent?.trim() === messagesFa["goals.openLifeArea"]);
    expect(link?.getAttribute("href")).toBe("/life-areas?focusId=health");
    expect(areaHtml).toContain("هدف‌های مرتبط");
    expect(areaHtml).toContain("مشاهده هدف‌های این حوزه");
  });
});
