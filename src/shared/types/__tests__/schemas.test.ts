import { describe, expect, it } from "vitest";

import {
  dailyCheckinSchema,
  decisionLogEntrySchema,
  journalEntrySchema,
  inboxItemSchema,
  knowledgeItemSchema,
  manualEntrySchema,
  projectSchema,
  taskSchema,
} from "@/shared/types";
import {
  dailyCheckinRecord,
  decisionLogRecord,
  journalEntryRecord,
  inboxItemRecord,
  knowledgeItemRecord,
  manualEntryRecord,
  projectRecord,
  taskRecord,
} from "@/test/factories";

describe("core domain schemas", () => {
  it.each([
    ["project", projectSchema, projectRecord],
    ["task", taskSchema, taskRecord],
    ["journal entry", journalEntrySchema, journalEntryRecord],
    ["knowledge item", knowledgeItemSchema, knowledgeItemRecord],
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
    ["journal entry", journalEntrySchema, { ...journalEntryRecord, content: "" }],
    ["knowledge item", knowledgeItemSchema, { ...knowledgeItemRecord, type: "unknown" }],
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
