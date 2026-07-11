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
      body: "This is a calmer draft rule for testing.",
      status: "draft" as const,
      category: "values" as const,
      tags: ["Draft", "calm"],
    };

    const result = filterManualEntries(
      [manualEntryRecord, draftEntry],
      {
        category: "values",
        status: "draft",
        query: "CALM",
      }
    );

    expect(result).toEqual([draftEntry]);
  });

  it("filters entries by importance in the text query", () => {
    const importanceMatch = {
      ...manualEntryRecord,
      id: "manual-important",
      title: "Calm rule",
      body: "This note should match by importance.",
      importance: "medium" as const,
    };

    const result = filterManualEntries(
      [manualEntryRecord, importanceMatch],
      {
        category: "all",
        status: "all",
        query: "medium",
      }
    );

    expect(result).toEqual([importanceMatch]);
  });

  it("detects review-due entries using lastReviewedAt or updatedAt", () => {
    expect(isManualEntryReviewDue(manualEntryRecord, new Date("2026-07-12T12:00:00.000Z"))).toBe(
      true
    );
    expect(isManualEntryReviewDue(manualEntryRecord, new Date("2026-07-09T12:00:00.000Z"))).toBe(
      false
    );
    expect(
      isManualEntryReviewDue(
        {
          ...manualEntryRecord,
          status: "archived",
          id: "manual-archived",
        },
        new Date("2026-07-20T12:00:00.000Z")
      )
    ).toBe(false);
    expect(
      isManualEntryReviewDue(
        {
          ...manualEntryRecord,
          id: "manual-invalid-interval",
          reviewIntervalDays: 0 as never,
        },
        new Date("2026-07-20T12:00:00.000Z")
      )
    ).toBe(false);
  });

  it("summarizes manual entries for Home", () => {
    const summary = getManualEntrySummary([manualEntryRecord], new Date("2026-07-12T12:00:00.000Z"));

    expect(summary.totalCount).toBe(1);
    expect(summary.activeCount).toBe(1);
    expect(summary.reviewDueCount).toBe(1);
    expect(summary.latestUpdatedEntry?.id).toBe(manualEntryRecord.id);
  });

  it("summarizes empty manual data safely", () => {
    const summary = getManualEntrySummary([]);

    expect(summary.totalCount).toBe(0);
    expect(summary.activeCount).toBe(0);
    expect(summary.reviewDueCount).toBe(0);
    expect(summary.latestUpdatedEntry).toBeUndefined();
  });
});
