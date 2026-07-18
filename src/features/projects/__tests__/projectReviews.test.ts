import { describe, expect, it } from "vitest";

import { projectRecord } from "@/test/factories";

import {
  clearDueProjectReviewDate,
  isProjectRecurringReviewDue,
  isProjectReviewDateDue,
  isProjectReviewDue,
} from "../projectReviews";

const referenceDate = new Date("2026-07-10T10:00:00.000Z");

describe("project review lifecycle", () => {
  it("keeps the existing one-time review date compatible and due-aware", () => {
    const project = { ...projectRecord, reviewDate: "2026-07-09" };

    expect(isProjectReviewDateDue(project, referenceDate)).toBe(true);
    expect(clearDueProjectReviewDate(project, referenceDate)).toBeUndefined();
  });

  it("flags a recurring review from the last review or last update", () => {
    expect(
      isProjectRecurringReviewDue(
        {
          ...projectRecord,
          reviewDate: undefined,
          reviewIntervalDays: 7,
          lastReviewedAt: "2026-07-03T08:30:00.000Z",
        },
        referenceDate
      )
    ).toBe(true);

    expect(
      isProjectRecurringReviewDue(
        {
          ...projectRecord,
          reviewDate: undefined,
          reviewIntervalDays: 7,
          lastReviewedAt: "2026-07-05T08:30:00.000Z",
        },
        referenceDate
      )
    ).toBe(false);
  });

  it("does not surface inactive projects or clear a future one-time date", () => {
    const project = {
      ...projectRecord,
      status: "completed" as const,
      reviewDate: "2026-07-09",
      reviewIntervalDays: 1,
      lastReviewedAt: "2026-07-01T08:30:00.000Z",
    };

    expect(isProjectReviewDue(project, referenceDate)).toBe(false);
    expect(
      clearDueProjectReviewDate(
        { ...projectRecord, reviewDate: "2026-07-12" },
        referenceDate
      )
    ).toBe("2026-07-12");
  });
});
