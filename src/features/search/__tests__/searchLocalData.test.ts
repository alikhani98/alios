import { describe, expect, it } from "vitest";

import type {
  InboxItem,
  JournalEntry,
  KnowledgeItem,
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
      },
      "check"
    );

    expect(results.some((result) => result.kind === "knowledge" && result.kindLabelKey === "search.typeKnowledge")).toBe(true);
    expect(results.some((result) => result.kind === "project" && result.kindLabelKey === "search.typeProject")).toBe(true);
  });
});
