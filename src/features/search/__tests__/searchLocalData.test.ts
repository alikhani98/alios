import { describe, expect, it } from "vitest";

import type {
  Goal,
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  LifeArea,
  ManualEntry,
  Project,
  Task,
} from "@/shared/types";

import { searchLocalData } from "../searchLocalData";
import { routineRecord } from "@/test/factories";

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

const goals: Goal[] = [
  {
    id: "goal-1",
    title: "Improve sleep",
    description: "Keep a regular bedtime and morning routine.",
    area: "health",
    timeframe: "quarter",
    status: "active",
    importance: "high",
    progressPercent: 35,
    reviewIntervalDays: 7,
    tags: ["Focus", "Reset"],
    createdAt: "2026-07-04T09:00:00.000Z",
    updatedAt: "2026-07-05T10:00:00.000Z",
  },
  {
    id: "goal-2",
    title: "Learn TypeScript",
    description: "Finish the local type safety checklist.",
    area: "learning",
    timeframe: "month",
    status: "paused",
    importance: "medium",
    progressPercent: 60,
    targetDate: "2026-08-01",
    reviewIntervalDays: 14,
    tags: ["study", "code"],
    createdAt: "2026-07-03T09:00:00.000Z",
    updatedAt: "2026-07-04T10:00:00.000Z",
  },
];

const lifeAreas: LifeArea[] = [
  {
    id: "life-area-1",
    areaKey: "health",
    title: "Health balance",
    description: "Keep a calm view of health routines and attention.",
    status: "active",
    attentionLevel: "high",
    satisfactionScore: 4,
    focusNote: "Revisit sleep, movement, and hydration.",
    reviewIntervalDays: 7,
    lastReviewedAt: "2026-07-05T08:00:00.000Z",
    tags: ["wellness", "routine"],
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
  it("finds a recurring routine and links to its focused page", () => {
    const [result] = searchLocalData({ inboxItems: [], tasks: [], projects: [], goals: [], journalEntries: [], knowledgeItems: [], manualEntries: [], routines: [routineRecord] }, "morning");
    expect(result).toMatchObject({ kind: "routine", href: "/routines?focusId=fixture-id" });
  });
  it("returns no results for an empty query", () => {
    expect(
      searchLocalData(
        {
          inboxItems,
          tasks,
          projects,
          goals: [],
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
        goals: [],
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
        goals: [],
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
          goals: [],
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
        goals: [],
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "check"
    );

    expect(
      results.some(
        (result) =>
          result.kind === "knowledge" &&
          result.kindLabelKey === "search.typeKnowledge"
      )
    ).toBe(true);
    expect(
      results.some(
        (result) =>
          result.kind === "project" && result.kindLabelKey === "search.typeProject"
      )
    ).toBe(true);
  });

  it("searches manual entries by title, body, tags, and status case-insensitively", () => {
    const titleResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals: [],
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
        goals: [],
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "focus"
    );

    expect(
      tagResults.some((result) => result.href === "/manual?focusId=manual-1")
    ).toBe(true);

    const draftResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals: [],
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "boundary"
    );

    expect(
      draftResults.some((result) => result.href === "/manual?focusId=manual-2")
    ).toBe(true);

    const archivedResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals: [],
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "legacy"
    );

    expect(
      archivedResults.some((result) => result.href === "/manual?focusId=manual-3")
    ).toBe(true);
  });

  it("searches manual entries by importance", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals: [],
        journalEntries,
        knowledgeItems,
        manualEntries,
      },
      "high"
    );

    expect(results.some((result) => result.href === "/manual?focusId=manual-1")).toBe(true);
  });

  it("searches goals by title, description, area, status, and tags", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals,
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "sleep"
    );

    expect(results.some((result) => result.kind === "goal")).toBe(true);
    expect(results.some((result) => result.kindLabelKey === "search.typeGoal")).toBe(true);
    expect(results.some((result) => result.href === "/goals?focusId=goal-1")).toBe(true);

    const tagResults = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals,
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "study"
    );

    expect(tagResults.some((result) => result.href === "/goals?focusId=goal-2")).toBe(true);
  });

  it("searches life areas by title, focus note, status, attention, and tags", () => {
    const results = searchLocalData(
      {
        inboxItems,
        tasks,
        projects,
        goals: [],
        lifeAreas,
        journalEntries,
        knowledgeItems,
        manualEntries: [],
      },
      "hydration"
    );

    expect(results.some((result) => result.kind === "lifeArea")).toBe(true);
    expect(results.some((result) => result.kindLabelKey === "search.typeLifeArea")).toBe(true);
    expect(results.some((result) => result.href === "/life-areas?focusId=life-area-1")).toBe(true);
  });
});
