import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlanningLoopStickyGuideContent } from "../components/PlanningLoopStickyGuide";
import {
  getPlanningLoopText,
  planningLoopContent,
  planningLoopSteps,
} from "../planningLoopGuide";

describe("planning loop sticky guide", () => {
  it("renders the five AliOS planning loop stages in order", () => {
    expect(planningLoopSteps.map((step) => step.id)).toEqual([
      "capture",
      "prioritize",
      "plan",
      "execute",
      "review",
    ]);

    const markup = renderToStaticMarkup(
      <PlanningLoopStickyGuideContent language="en" />
    );

    expect(markup).toContain("<section");
    expect(markup).toContain("<ol");
    expect(markup).toContain("AliOS planning loop stages");
    expect(markup).toContain("Capture");
    expect(markup).toContain("Prioritize");
    expect(markup).toContain("Plan");
    expect(markup).toContain("Execute");
    expect(markup).toContain("Review");
  });

  it("keeps the content honest and connected only to real routes", () => {
    expect(
      planningLoopSteps.every((step) => step.href.startsWith("#/"))
    ).toBe(true);
    expect(planningLoopSteps.map((step) => step.href)).toEqual([
      "#/inbox",
      "#/goals",
      "#/projects",
      "#/today",
      "#/weekly-review",
    ]);

    const combinedCopy = planningLoopSteps
      .flatMap((step) => [
        getPlanningLoopText("en", step.summary),
        getPlanningLoopText("en", step.example),
      ])
      .join(" ");

    expect(combinedCopy).not.toMatch(/\bAI\b|sync|cloud|automatic schedule/i);
    expect(combinedCopy).toContain("without over-organizing");
    expect(combinedCopy).toContain("existing local records");
  });

  it("provides static fallbacks for reduced motion, mobile, and short viewports", () => {
    const markup = renderToStaticMarkup(
      <PlanningLoopStickyGuideContent language="en" />
    );

    expect(markup).toContain("lg:sticky");
    expect(markup).toContain("motion-reduce:static");
    expect(markup).toContain("[@media_(max-height:760px)]:static");
    expect(markup).toContain(
      getPlanningLoopText("en", planningLoopContent.staticFallbackNote)
    );
  });

  it("renders one accessible content instance and no hidden duplicate cards", () => {
    const markup = renderToStaticMarkup(
      <PlanningLoopStickyGuideContent language="en" />
    );

    expect(markup).not.toContain("aria-hidden=\"true\"><article");
    expect(markup.match(/data-planning-loop-step=/g)?.length).toBe(5);
    expect(markup.match(/data-planning-loop-step="capture"/g)?.length).toBe(1);
    expect(markup.match(/data-planning-loop-step="prioritize"/g)?.length).toBe(1);
    expect(markup.match(/data-planning-loop-step="plan"/g)?.length).toBe(1);
    expect(markup.match(/data-planning-loop-step="execute"/g)?.length).toBe(1);
    expect(markup.match(/data-planning-loop-step="review"/g)?.length).toBe(1);
  });

  it("shows a readable empty fallback if guide content is unavailable", () => {
    const markup = renderToStaticMarkup(
      <PlanningLoopStickyGuideContent language="en" steps={[]} />
    );

    expect(markup).toContain("Planning guide unavailable");
    expect(markup).toContain("capture, prioritize, plan, execute, then review");
    expect(markup).not.toContain("<ol");
  });
});
