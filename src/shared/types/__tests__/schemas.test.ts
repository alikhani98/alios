import { describe, expect, it } from "vitest";

import {
  dailyCheckinSchema,
  decisionLogEntrySchema,
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

  it("keeps legacy tasks without a project link valid", () => {
    const { projectId: _projectId, ...legacyTask } = taskRecord;

    expect(taskSchema.safeParse(legacyTask).success).toBe(true);
  });

  it("rejects an empty task project link", () => {
    expect(taskSchema.safeParse({ ...taskRecord, projectId: "" }).success).toBe(
      false
    );
  });

  it.each([
    ["project", projectSchema, projectRecord],
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
});
