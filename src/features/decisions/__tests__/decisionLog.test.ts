import { describe, expect, it } from "vitest";

import type { DecisionLogEntry } from "@/shared/types";

import {
  filterDecisionLogEntries,
  getDecisionLogFilterCounts,
  isDecisionNeedsReview,
} from "../decisionLog";

function createDecision(
  id: string,
  overrides: Partial<DecisionLogEntry> = {}
): DecisionLogEntry {
  return {
    id,
    title: `Decision ${id}`,
    decisionDate: "2026-07-05",
    status: "open",
    context: `Context ${id}`,
    options: ["Option A", "Option B"],
    tags: [],
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
    ...overrides,
  };
}

describe("decision log helpers", () => {
  it("treats future review dates as not due", () => {
    expect(
      isDecisionNeedsReview(
        createDecision("future", {
          reviewDate: "2026-07-12",
        }),
        new Date(2026, 6, 10)
      )
    ).toBe(false);
  });

  it("treats past and today review dates as due", () => {
    expect(
      isDecisionNeedsReview(
        createDecision("past", {
          reviewDate: "2026-07-09",
        }),
        new Date(2026, 6, 10)
      )
    ).toBe(true);

    expect(
      isDecisionNeedsReview(
        createDecision("today", {
          reviewDate: "2026-07-10",
        }),
        new Date(2026, 6, 10)
      )
    ).toBe(true);
  });

  it("ignores reviewed, archived, and missing review dates", () => {
    expect(
      isDecisionNeedsReview(
        createDecision("reviewed", {
          status: "reviewed",
          reviewDate: "2026-07-09",
        }),
        new Date(2026, 6, 10)
      )
    ).toBe(false);

    expect(
      isDecisionNeedsReview(
        createDecision("archived", {
          status: "archived",
          reviewDate: "2026-07-09",
        }),
        new Date(2026, 6, 10)
      )
    ).toBe(false);

    expect(
      isDecisionNeedsReview(
        createDecision("missing"),
        new Date(2026, 6, 10)
      )
    ).toBe(false);
  });

  it("filters decision entries by status and review state", () => {
    const entries = [
      createDecision("open", { status: "open" }),
      createDecision("decided", { status: "decided" }),
      createDecision("needs-review", {
        reviewDate: "2026-07-09",
      }),
      createDecision("reviewed", {
        status: "reviewed",
        reviewDate: "2026-07-09",
      }),
    ];

    expect(filterDecisionLogEntries(entries, "all", new Date(2026, 6, 10))).toHaveLength(4);
    expect(filterDecisionLogEntries(entries, "open", new Date(2026, 6, 10))).toHaveLength(2);
    expect(filterDecisionLogEntries(entries, "decided", new Date(2026, 6, 10))).toHaveLength(1);
    expect(filterDecisionLogEntries(entries, "needsReview", new Date(2026, 6, 10))).toHaveLength(1);
    expect(filterDecisionLogEntries(entries, "reviewed", new Date(2026, 6, 10))).toHaveLength(1);
  });

  it("counts filters consistently", () => {
    const counts = getDecisionLogFilterCounts(
      [
        createDecision("open", { status: "open" }),
        createDecision("decided", { status: "decided" }),
        createDecision("due", { reviewDate: "2026-07-09" }),
        createDecision("reviewed", { status: "reviewed" }),
      ],
      new Date(2026, 6, 10)
    );

    expect(counts).toEqual({
      all: 4,
      open: 2,
      decided: 1,
      needsReview: 1,
      reviewed: 1,
    });
  });
});
