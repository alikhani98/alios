import { describe, expect, it } from "vitest";

import type {
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  ManualEntry,
  Project,
  Task,
} from "@/shared/types";

import { searchLocalData } from "../searchLocalData";

const inboxItems: InboxItem[] = [
  {
    id: "inbox-1",
    content: "Read the project brief",
    type: "note",
    status: "unprocessed",
    createdAt: "2026-07-05T08:00:00.000Z",
    updatedAt: "2026-07-05T08:00:00.000Z",
  },
];

const tasks: Task[] = [
  {
    id: "task-1",
    title: "Book dentist appointment",
    description: "Call the clinic after lunch",
    status: "todo",
    priority: "high",
    isMit: false,
    createdAt: "2026-07-05T09:00:00.000Z",
    updatedAt: "2026-07-05T09:00:00.000Z",
  },
];

const projects: Project[] = [
  {
    id: "project-1",
    title: "Website launch",
    description: "Prepare the final release checklist",
    status: "active",
    priority: "medium",
    createdAt: "2026-07-04T09:00:00.000Z",
    updatedAt: "2026-07-05T10:00:00.000Z",
  },
];

const journalEntries: JournalEntry[] = [
  {
    id: "journal-1",
    date: "2026-07-05",
    type: "learning",
    title: "What I learned today",
    content: "I learned how to keep local search simple.",
    createdAt: "2026-07-05T11:00:00.000Z",
    updatedAt: "2026-07-05T11:00:00.000Z",
  },
];

const knowledgeItems: KnowledgeItem[] = [
  {
    id: "knowledge-1",
    title: "Search checklist",
    type: "checklist",
    summary: "Keep the query local and plain text.",
    content: "Always trim queries and compare case-insensitively.",
    createdAt: "2026-07-03T11:00:00.000Z",
    updatedAt: "2026-07-05T12:00:00.000Z",
  },
];

const manualEntries: ManualEntry[] = [
  {
    id: "manual-1",
    title: "Calm rules",
    body: "Keep the note calm, brief, and practical.",
    category: "principles",
    importance: "high",
    status: "active",
    tags: ["Focus", "Reset"],
    reviewIntervalDays: 7,
    createdAt: "2026-07-02T08:00:00.000Z",
    updatedAt: "2026-07-05T12:00:00.000Z",
  },
  {
    id: "manual-2",
    title: "Draft boundary",
    body: "Draft work boundary note for future review.",
    category: "boundaries",
    importance: "medium",
    status: "draft",
    tags: ["Work", "Focus"],
    reviewIntervalDays: 14,
    createdAt: "2026-07-03T08:00:00.000Z",
    updatedAt: "2026-07-04T12:00:00.000Z",
  },
  {
    id: "manual-3",
    title: "Archived lesson",
    body: "Archived lesson about keeping routines simple.",
    category: "lessons",
    importance: "low",
    status: "archived",
    tags: ["Legacy"],
    reviewIntervalDays: 21,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-03T12:00:00.000Z",
  },
];

describe("searchLocalData", () => {
  it("returns no results for an empty query", () => {
    expect(
      searchLocalData(
        {
          inboxItems,
          tasks,
          projects,
          journalEntries,
          knowledgeItems,
          manualEntries: [],
        },
        "   "
      )
    ).toEqual([]);
  });

  it("matches case-insensitively and trims the query", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "  PROJECT  "
    );

    expect(results.some((result) => result.kind === "inbox")).toBe(true);
    expect(results).toHaveLength(1);
  });

  it("searches across multiple item types", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "local"
    );

    expect(results.map((result) => result.kind)).toEqual(
      expect.arrayContaining(["journal", "knowledge"])
    );
  });

  it("returns no results when nothing matches", () => {
    expect(
      searchLocalData(
        {
          inboxItems,
          tasks,
          projects,
          journalEntries,
          knowledgeItems,
          manualEntries: [],
        },
        "missing phrase"
      )
    ).toEqual([]);
  });

  it("includes type labels for each result kind", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "check"
    );

    expect(results.some((result) => result.kind === "knowledge" && result.kindLabelKey === "search.typeKnowledge")).toBe(true);
    expect(results.some((result) => result.kind === "project" && result.kindLabelKey === "search.typeProject")).toBe(true);
  });

  it("searches manual entries by title, body, tags, and status case-insensitively", () => {
    const titleResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "  calm  "
    );

    expect(titleResults.some((result) => result.kind === "manual")).toBe(true);
    expect(titleResults.find((result) => result.kind === "manual")?.kindLabelKey).toBe(
      "search.typeManual"
    );

    const tagResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "focus"
    );

    expect(tagResults.some((result) => result.href === "/manual?focusId=manual-1")).toBe(true);

    const draftResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "boundary"
    );

    expect(draftResults.some((result) => result.href === "/manual?focusId=manual-2")).toBe(true);

    const archivedResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "legacy"
    );

    expect(archivedResults.some((result) => result.href === "/manual?focusId=manual-3")).toBe(true);
  });

  it("searches manual entries by importance", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "high"
    );

    expect(results.some((result) => result.href === "/manual?focusId=manual-1")).toBe(true);
  });
});
