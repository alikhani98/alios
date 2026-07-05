import { describe, expect, it } from "vitest";

import {
  dailyCheckinSchema,
  journalEntrySchema,
  knowledgeItemSchema,
  projectSchema,
  taskSchema,
} from "@/shared/types";
import {
  dailyCheckinRecord,
  journalEntryRecord,
  knowledgeItemRecord,
  projectRecord,
  taskRecord,
} from "@/test/factories";

describe("core domain schemas", () => {
  it.each([
    ["project", projectSchema, projectRecord],
    ["task", taskSchema, taskRecord],
    ["journal entry", journalEntrySchema, journalEntryRecord],
    ["knowledge item", knowledgeItemSchema, knowledgeItemRecord],
    ["daily check-in", dailyCheckinSchema, dailyCheckinRecord],
  ])("accepts a valid %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ["project", projectSchema, { ...projectRecord, title: " " }],
    ["task", taskSchema, { ...taskRecord, status: "unknown" }],
    ["journal entry", journalEntrySchema, { ...journalEntryRecord, content: "" }],
    ["knowledge item", knowledgeItemSchema, { ...knowledgeItemRecord, type: "unknown" }],
    ["daily check-in", dailyCheckinSchema, { ...dailyCheckinRecord, date: "05/07/2026" }],
  ])("rejects an invalid %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});
