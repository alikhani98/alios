import { describe, expect, it } from "vitest";

import { manualEntryRecord } from "@/test/factories";

import {
  filterManualEntries,
  getManualEntrySummary,
  isManualEntryReviewDue,
  sortManualEntries,
} from "../manualEntries";

describe("manual entry helpers", () => {
  it("sorts entries by updatedAt descending", () => {
    const older = {
      ...manualEntryRecord,
      id: "manual-older",
      updatedAt: "2026-07-03T08:30:00.000Z",
    };
    const newer = {
      ...manualEntryRecord,
      id: "manual-newer",
      updatedAt: "2026-07-06T08:30:00.000Z",
    };

    expect(sortManualEntries([older, newer]).map((entry) => entry.id)).toEqual([
      "manual-newer",
      "manual-older",
    ]);
  });

  it("filters entries by category, status, and text query", () => {
    const draftEntry = {
      ...manualEntryRecord,
      id: "manual-draft",
      title: "Draft rule",
      status: "draft" as const,
      category: "values" as const,
      tags: ["draft"],
    };

    const result = filterManualEntries(
      [manualEntryRecord, draftEntry],
      {
        category: "values",
        status: "draft",
        query: "draft",
      }
    );

    expect(result).toEqual([draftEntry]);
  });

  it("detects review-due entries using lastReviewedAt or updatedAt", () => {
    expect(isManualEntryReviewDue(manualEntryRecord, new Date("2026-07-12T12:00:00.000Z"))).toBe(
      true
    );
    expect(isManualEntryReviewDue(manualEntryRecord, new Date("2026-07-09T12:00:00.000Z"))).toBe(
      false
    );
  });

  it("summarizes manual entries for Home", () => {
    const summary = getManualEntrySummary([manualEntryRecord], new Date("2026-07-12T12:00:00.000Z"));

    expect(summary.totalCount).toBe(1);
    expect(summary.activeCount).toBe(1);
    expect(summary.reviewDueCount).toBe(1);
    expect(summary.latestUpdatedEntry?.id).toBe(manualEntryRecord.id);
  });
});
