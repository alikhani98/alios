import { describe, expect, it } from "vitest";

import type {
  DailyCheckin,
  DecisionLogEntry,
  FinanceObligation,
  FinanceTransaction,
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
} from "@/shared/types";

import {
  buildWeeklyReviewSummary,
  getWeeklyReviewWindow,
} from "../weeklyReviewCalculations";

function createTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    status: "todo",
    priority: "medium",
    isMit: false,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    title: `Project ${id}`,
    status: "active",
    priority: "medium",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createInboxItem(id: string, overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id,
    content: `Inbox item ${id}`,
    type: "note",
    status: "unprocessed",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createJournalEntry(
  id: string,
  overrides: Partial<JournalEntry> = {}
): JournalEntry {
  return {
    id,
    date: "2026-07-01",
    type: "daily",
    title: `Journal ${id}`,
    content: `Journal entry ${id}`,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createKnowledgeItem(
  id: string,
  overrides: Partial<KnowledgeItem> = {}
): KnowledgeItem {
  return {
    id,
    title: `Knowledge ${id}`,
    type: "note",
    content: `Knowledge content ${id}`,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createTransaction(
  id: string,
  overrides: Partial<FinanceTransaction> = {}
): FinanceTransaction {
  return {
    id,
    type: "income",
    title: `Transaction ${id}`,
    amount: 1000,
    category: "salary",
    occurredAt: "2026-07-01",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createObligation(
  id: string,
  overrides: Partial<FinanceObligation> = {}
): FinanceObligation {
  return {
    id,
    type: "debt",
    title: `Obligation ${id}`,
    totalAmount: 1000,
    paidAmount: 250,
    dueAmount: 250,
    status: "active",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createCheckin(id: string, overrides: Partial<DailyCheckin> = {}): DailyCheckin {
  return {
    id,
    date: "2026-07-01",
    sleepQuality: "medium",
    energyLevel: "medium",
    moodLevel: "medium",
    stressLevel: "medium",
    medicationDone: false,
    smokingStatus: "none",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createDecision(
  id: string,
  overrides: Partial<DecisionLogEntry> = {}
): DecisionLogEntry {
  return {
    id,
    title: `Decision ${id}`,
    decisionDate: "2026-07-01",
    status: "open",
    context: `Decision context ${id}`,
    options: ["Option A", "Option B"],
    tags: [],
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("weekly review calculations", () => {
  it("builds a safe zero summary for empty data", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [],
        projects: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.reviewWindow).toEqual({
      days: 7,
      startDate: "2026-07-04",
      endDate: "2026-07-10",
    });
    expect(summary.taskSummary).toEqual({
      totalCount: 0,
      completedCount: 0,
      openCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
      completedInWindowCount: 0,
    });
    expect(summary.projectSummary).toEqual({
      totalCount: 0,
      activeCount: 0,
      projectsWithNextActionCount: 0,
      needsAttentionCount: 0,
    });
    expect(summary.inboxSummary).toEqual({
      totalCount: 0,
      pendingCount: 0,
      processedCount: 0,
      capturedInWindowCount: 0,
    });
    expect(summary.journalSummary).toEqual({
      totalCount: 0,
      entriesInWindowCount: 0,
      averageMoodLevel: null,
      averageEnergyLevel: null,
    });
    expect(summary.knowledgeSummary).toEqual({
      totalCount: 0,
      createdInWindowCount: 0,
    });
    expect(summary.decisionSummary).toEqual({
      totalCount: 0,
      createdInWindowCount: 0,
      needsReviewCount: 0,
      reviewedInWindowCount: 0,
    });
    expect(summary.financeSummary).toEqual({
      transactionCount: 0,
      incomeInWindow: 0,
      expensesInWindow: 0,
      netCashflowInWindow: 0,
      activeObligationsCount: 0,
      upcomingObligationsCount: 0,
      remainingObligationTotal: 0,
      monthlyObligationsEstimate: 0,
    });
    expect(summary.wellnessSummary).toEqual({
      checkinCountInWindow: 0,
      notesCountInWindow: 0,
      averageMoodLevel: null,
      averageEnergyLevel: null,
    });
    expect(summary.focusObservations).toEqual([
      { kind: "noData", tone: "awareness" },
    ]);
    expect(summary.suggestedFocus).toEqual([
      { kind: "addFirstTask", tone: "next-focus" },
    ]);
    expect(summary.emptyStates.map((item) => item.sectionId)).toEqual([
      "tasks",
      "projects",
      "inbox",
      "journal",
      "knowledge",
      "decisions",
      "finance",
      "wellness",
    ]);
    expect(summary.hasAnyData).toBe(false);
  });

  it("includes items on the last-7-days boundary and ignores older records", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [
          createTask("boundary-complete", {
            status: "done",
            completedAt: "2026-07-04T09:00:00.000Z",
            updatedAt: "2026-07-04T09:00:00.000Z",
          }),
          createTask("outside-complete", {
            status: "done",
            completedAt: "2026-07-03T09:00:00.000Z",
            updatedAt: "2026-07-03T09:00:00.000Z",
          }),
          createTask("future-due-soon", {
            dueDate: "2026-07-17",
          }),
          createTask("future-due-too-late", {
            dueDate: "2026-07-18",
          }),
        ],
        projects: [],
        inboxItems: [
          createInboxItem("boundary-inbox", {
            createdAt: "2026-07-10T10:00:00.000Z",
            updatedAt: "2026-07-10T10:00:00.000Z",
          }),
          createInboxItem("outside-inbox", {
            createdAt: "2026-07-03T10:00:00.000Z",
            updatedAt: "2026-07-03T10:00:00.000Z",
          }),
        ],
        journalEntries: [
          createJournalEntry("boundary-journal", {
            date: "2026-07-10",
          }),
          createJournalEntry("outside-journal", {
            date: "2026-07-03",
          }),
        ],
        knowledgeItems: [
          createKnowledgeItem("boundary-knowledge", {
            createdAt: "2026-07-10T12:00:00.000Z",
            updatedAt: "2026-07-10T12:00:00.000Z",
          }),
          createKnowledgeItem("outside-knowledge", {
            createdAt: "2026-07-03T12:00:00.000Z",
            updatedAt: "2026-07-03T12:00:00.000Z",
          }),
        ],
        decisionLogEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.taskSummary.completedInWindowCount).toBe(1);
    expect(summary.inboxSummary.capturedInWindowCount).toBe(1);
    expect(summary.journalSummary.entriesInWindowCount).toBe(1);
    expect(summary.knowledgeSummary.createdInWindowCount).toBe(1);
    expect(summary.taskSummary.dueSoonCount).toBe(1);
  });

  it("counts completed tasks and overdue tasks correctly", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [
          createTask("completed", {
            status: "done",
            completedAt: "2026-07-08T08:00:00.000Z",
            updatedAt: "2026-07-08T08:00:00.000Z",
          }),
          createTask("completed-outside", {
            status: "done",
            completedAt: "2026-06-30T08:00:00.000Z",
            updatedAt: "2026-06-30T08:00:00.000Z",
          }),
          createTask("overdue", {
            dueDate: "2026-07-07",
          }),
          createTask("open", {
            status: "doing",
            dueDate: "2026-07-12",
          }),
          createTask("cancelled", {
            status: "cancelled",
            dueDate: "2026-07-07",
          }),
        ],
        projects: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.taskSummary).toMatchObject({
      completedCount: 2,
      openCount: 2,
      overdueCount: 1,
      completedInWindowCount: 1,
    });
  });

  it("keeps finance totals within the weekly window and preserves finance semantics", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [],
        projects: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        financeTransactions: [
          createTransaction("income", {
            type: "income",
            amount: 5000,
            occurredAt: "2026-07-05",
          }),
          createTransaction("expense", {
            type: "expense",
            amount: 1200,
            category: "groceries",
            occurredAt: "2026-07-09",
          }),
          createTransaction("outside-window", {
            type: "expense",
            amount: 9999,
            occurredAt: "2026-07-18",
          }),
        ],
        financeObligations: [
          createObligation("active", {
            monthlyAmount: 400,
            dueDay: 12,
          }),
          createObligation("paid", {
            status: "paid",
            totalAmount: 500,
            paidAmount: 500,
          }),
        ],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.financeSummary).toMatchObject({
      transactionCount: 2,
      incomeInWindow: 5000,
      expensesInWindow: 1200,
      netCashflowInWindow: 3800,
      activeObligationsCount: 1,
      remainingObligationTotal: 750,
      monthlyObligationsEstimate: 400,
    });
    expect(summary.financeSummary.upcomingObligationsCount).toBe(1);
  });

  it("produces deterministic observations and a stable focus rule", () => {
    const input = {
      tasks: [
        createTask("overdue", {
          dueDate: "2026-07-05",
        }),
      ],
      projects: [
        createProject("project", {
          nextAction: "Write the outline",
          reviewDate: "2026-07-09",
        }),
      ],
      inboxItems: [
        createInboxItem("pending"),
      ],
      journalEntries: [
        createJournalEntry("journal", {
          date: "2026-07-08",
          moodLevel: "good",
          energyLevel: "medium",
        }),
      ],
      knowledgeItems: [
        createKnowledgeItem("knowledge", {
          createdAt: "2026-07-08T08:00:00.000Z",
          updatedAt: "2026-07-08T08:00:00.000Z",
        }),
      ],
      decisionLogEntries: [
        createDecision("decision", {
          reviewDate: "2026-07-09",
        }),
      ],
      financeTransactions: [
        createTransaction("expense", {
          type: "expense",
          amount: 300,
          occurredAt: "2026-07-09",
        }),
      ],
      financeObligations: [],
      dailyCheckins: [
        createCheckin("checkin", {
          date: "2026-07-09",
          moodLevel: "good",
          energyLevel: "good",
          notes: "Felt steady.",
        }),
      ],
    };

    const first = buildWeeklyReviewSummary(input, new Date(2026, 6, 10));
    const second = buildWeeklyReviewSummary(input, new Date(2026, 6, 10));

    expect(first.focusObservations).toEqual(second.focusObservations);
    expect(first.focusObservations.map((item) => item.kind)).toEqual([
      "overdueTasks",
      "pendingInbox",
      "journalReflection",
      "financeBalance",
    ]);
    expect(first.decisionSummary).toMatchObject({
      totalCount: 1,
      createdInWindowCount: 0,
      needsReviewCount: 1,
      reviewedInWindowCount: 0,
    });
    expect(first.suggestedFocus).toEqual([
      { kind: "processInbox", tone: "next-focus" },
    ]);
  });

  it("does not count future data unless it is intentionally due soon", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [
          createTask("soon", {
            dueDate: "2026-07-17",
          }),
          createTask("too-late", {
            dueDate: "2026-07-18",
          }),
        ],
        projects: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        financeTransactions: [
          createTransaction("future-income", {
            type: "income",
            amount: 2000,
            occurredAt: "2026-07-18",
          }),
        ],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.taskSummary.dueSoonCount).toBe(1);
    expect(summary.financeSummary.transactionCount).toBe(0);
    expect(summary.financeSummary.netCashflowInWindow).toBe(0);
  });
});
