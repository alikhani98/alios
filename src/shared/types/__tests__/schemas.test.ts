import { describe, expect, it } from "vitest";

import {
  dailyCheckinSchema,
  decisionLogEntrySchema,
  goalSchema,
  journalEntrySchema,
  inboxItemSchema,
  knowledgeItemSchema,
  lifeAreaSchema,
  manualEntrySchema,
  projectSchema,
  taskSchema,
  routineSchema,
} from "@/shared/types";
import {
  dailyCheckinRecord,
  decisionLogRecord,
  goalRecord,
  journalEntryRecord,
  inboxItemRecord,
  knowledgeItemRecord,
  lifeAreaRecord,
  manualEntryRecord,
  projectRecord,
  taskRecord,
  routineRecord,
} from "@/test/factories";

describe("core domain schemas", () => {
  it("keeps legacy projects without a goal link valid", () => {
    const { goalId: _goalId, ...legacyProject } = projectRecord;

    expect(projectSchema.safeParse(legacyProject).success).toBe(true);
  });

  it("rejects an empty project goal link", () => {
    expect(
      projectSchema.safeParse({ ...projectRecord, goalId: "" }).success
    ).toBe(false);
  });

  it("keeps legacy projects valid while validating optional review lifecycle fields", () => {
    const { reviewIntervalDays: _interval, lastReviewedAt: _reviewedAt, ...legacyProject } = projectRecord;

    expect(projectSchema.safeParse(legacyProject).success).toBe(true);
    expect(
      projectSchema.safeParse({ ...projectRecord, reviewIntervalDays: 0 }).success
    ).toBe(false);
    expect(
      projectSchema.safeParse({ ...projectRecord, lastReviewedAt: "not-a-date" }).success
    ).toBe(false);
  });

  it("keeps legacy tasks without a project link valid", () => {
    const { projectId: _projectId, ...legacyTask } = taskRecord;

    expect(taskSchema.safeParse(legacyTask).success).toBe(true);
  });

  it("rejects an empty task project link", () => {
    expect(taskSchema.safeParse({ ...taskRecord, projectId: "" }).success).toBe(
      false
    );
  });

  it("keeps legacy Journal, Knowledge, and Decision records without structural links valid", () => {
    const { projectId: _journalProjectId, goalId: _journalGoalId, ...legacyJournalEntry } =
      journalEntryRecord;
    const {
      projectId: _knowledgeProjectId,
      goalId: _knowledgeGoalId,
      ...legacyKnowledgeItem
    } = knowledgeItemRecord;
    const {
      projectId: _decisionProjectId,
      goalId: _decisionGoalId,
      ...legacyDecisionEntry
    } = decisionLogRecord;

    expect(journalEntrySchema.safeParse(legacyJournalEntry).success).toBe(true);
    expect(knowledgeItemSchema.safeParse(legacyKnowledgeItem).success).toBe(true);
    expect(decisionLogEntrySchema.safeParse(legacyDecisionEntry).success).toBe(true);
  });

  it("rejects empty structural Project and Goal links on Journal, Knowledge, and Decision records", () => {
    expect(
      journalEntrySchema.safeParse({ ...journalEntryRecord, projectId: "" }).success
    ).toBe(false);
    expect(
      journalEntrySchema.safeParse({ ...journalEntryRecord, goalId: "" }).success
    ).toBe(false);
    expect(
      knowledgeItemSchema.safeParse({ ...knowledgeItemRecord, projectId: "" }).success
    ).toBe(false);
    expect(
      knowledgeItemSchema.safeParse({ ...knowledgeItemRecord, goalId: "" }).success
    ).toBe(false);
    expect(
      decisionLogEntrySchema.safeParse({ ...decisionLogRecord, projectId: "" }).success
    ).toBe(false);
    expect(
      decisionLogEntrySchema.safeParse({ ...decisionLogRecord, goalId: "" }).success
    ).toBe(false);
  });

  it("keeps project milestones optional and validates supplied checklist items", () => {
    expect(projectSchema.safeParse(projectRecord).success).toBe(true);
    expect(
      projectSchema.safeParse({
        ...projectRecord,
        milestones: [
          { id: "outline", title: "Outline", done: false, date: "2026-09-01" },
        ],
      }).success
    ).toBe(true);
    expect(
      projectSchema.safeParse({
        ...projectRecord,
        milestones: [{ id: "bad", title: " ", done: false }],
      }).success
    ).toBe(false);
  });

  it("keeps goal milestones and key results optional and validates supplied values", () => {
    expect(goalSchema.safeParse(goalRecord).success).toBe(true);
    expect(
      goalSchema.safeParse({
        ...goalRecord,
        milestones: [
          { id: "first", title: "First milestone", done: true, date: "2026-09-01" },
        ],
        keyResults: [
          { id: "kr-1", title: "Finish draft", progressPercent: 75 },
          { id: "kr-2", title: "Publish review", progressPercent: 20 },
        ],
      }).success
    ).toBe(true);
    expect(
      goalSchema.safeParse({
        ...goalRecord,
        keyResults: [{ id: "bad", title: "Impossible", progressPercent: 120 }],
      }).success
    ).toBe(false);
  });

  it("keeps task time-blocking metadata optional and validates supplied values", () => {
    expect(
      taskSchema.safeParse({
        ...taskRecord,
        scheduledStartTime: "09:30",
        estimatedMinutes: 45,
      }).success
    ).toBe(true);
    expect(
      taskSchema.safeParse({ ...taskRecord, scheduledStartTime: "9:30" }).success
    ).toBe(false);
    expect(
      taskSchema.safeParse({ ...taskRecord, estimatedMinutes: 3 }).success
    ).toBe(false);
  });

  it("accepts a valid routine task", () => {
    expect(
      taskSchema.safeParse({
        ...taskRecord,
        routineId: "routine-id",
        recurrence: undefined,
        recurrenceSeriesId: undefined,
      }).success
    ).toBe(true);
  });

  it("accepts a valid recurring task", () => {
    expect(
      taskSchema.safeParse({
        ...taskRecord,
        recurrence: { frequency: "daily" },
        recurrenceSeriesId: "series-id",
        routineId: undefined,
      }).success
    ).toBe(true);
  });

  it("rejects a task that mixes routine and recurring task fields", () => {
    expect(
      taskSchema.safeParse({
        ...taskRecord,
        routineId: "routine-id",
        recurrence: { frequency: "weekly" },
        recurrenceSeriesId: "series-id",
      }).success
    ).toBe(false);
  });

  it.each([
    ["project", projectSchema, projectRecord],
    ["goal", goalSchema, goalRecord],
    ["task", taskSchema, taskRecord],
    ["routine", routineSchema, routineRecord],
    ["journal entry", journalEntrySchema, journalEntryRecord],
    ["knowledge item", knowledgeItemSchema, knowledgeItemRecord],
    ["life area", lifeAreaSchema, lifeAreaRecord],
    ["manual entry", manualEntrySchema, manualEntryRecord],
    ["daily check-in", dailyCheckinSchema, dailyCheckinRecord],
    ["decision log entry", decisionLogEntrySchema, decisionLogRecord],
    ["inbox item", inboxItemSchema, inboxItemRecord],
  ])("accepts a valid %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ["project", projectSchema, { ...projectRecord, title: " " }],
    ["task", taskSchema, { ...taskRecord, status: "unknown" }],
    ["routine", routineSchema, { ...routineRecord, weekdays: [] }],
    ["journal entry", journalEntrySchema, { ...journalEntryRecord, content: "" }],
    ["knowledge item", knowledgeItemSchema, { ...knowledgeItemRecord, type: "unknown" }],
    ["life area", lifeAreaSchema, { ...lifeAreaRecord, status: "unknown" }],
    ["manual entry", manualEntrySchema, { ...manualEntryRecord, category: "unknown" }],
    ["daily check-in", dailyCheckinSchema, { ...dailyCheckinRecord, date: "05/07/2026" }],
    ["decision log entry", decisionLogEntrySchema, { ...decisionLogRecord, status: "maybe" }],
  ])("rejects an invalid %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  it.each([
    ["empty content", { ...inboxItemRecord, content: "   " }],
    ["invalid type", { ...inboxItemRecord, type: "event" }],
    ["invalid status", { ...inboxItemRecord, status: "archived" }],
  ])("rejects an inbox item with %s", (_name, value) => {
    expect(inboxItemSchema.safeParse(value).success).toBe(false);
  });

  it("accepts an optional Inbox snooze date without requiring legacy records to have it", () => {
    expect(inboxItemSchema.parse(inboxItemRecord).snoozedUntil).toBeUndefined();
    expect(
      inboxItemSchema.parse({ ...inboxItemRecord, snoozedUntil: "2026-07-06" })
    ).toMatchObject({ snoozedUntil: "2026-07-06" });
  });
});
