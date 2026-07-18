import { describe, expect, it } from "vitest";

import type {
  DailyCheckin,
  DecisionLogEntry,
  Goal,
  FinanceObligation,
  FinanceTransaction,
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  LifeArea,
  ManualEntry,
  Project,
  Task,
} from "@/shared/types";

import {
  buildWeeklyReviewSummary,
  getWeeklyReviewManualDueEntries,
  getWeeklyReviewWindow,
} from "../weeklyReviewCalculations";
import { getReviewDueGoals } from "@/features/goals";

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

function createGoal(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    title: `Goal ${id}`,
    description: `Goal description ${id}`,
    area: "personal",
    timeframe: "month",
    status: "active",
    importance: "medium",
    progressPercent: 50,
    reviewIntervalDays: 7,
    tags: [],
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function createLifeArea(id: string, overrides: Partial<LifeArea> = {}): LifeArea {
  return {
    id,
    areaKey: "health",
    title: `Life area ${id}`,
    description: `Life area description ${id}`,
    status: "active",
    attentionLevel: "medium",
    satisfactionScore: 3,
    focusNote: `Life area focus ${id}`,
    reviewIntervalDays: 7,
    tags: [],
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

function createManualEntry(
  id: string,
  overrides: Partial<ManualEntry> = {}
): ManualEntry {
  return {
    id,
    title: `Manual ${id}`,
    body: `Manual body ${id}`,
    category: "principles",
    importance: "medium",
    status: "active",
    tags: [],
    reviewIntervalDays: 7,
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
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
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
    expect(summary.routineSummary).toEqual({
      linkedTaskCount: 0,
      plannedInWindowCount: 0,
      completedInWindowCount: 0,
      openInWindowCount: 0,
      completionPercent: 0,
    });
    expect(summary.planningSummary).toEqual({
      linkedProjectCount: 0,
      linkedTaskCount: 0,
      completedLinkedTaskCount: 0,
      openLinkedTaskCount: 0,
      completionPercent: 0,
      unavailableGoalProjectCount: 0,
      attentionEntries: [],
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
    expect(summary.goalSummary).toEqual({
      totalCount: 0,
      dueCount: 0,
      dueEntries: [],
    });
    expect(summary.lifeAreaSummary).toEqual({
      totalCount: 0,
      activeCount: 0,
      highAttentionActiveCount: 0,
      dueCount: 0,
      dueEntries: [],
    });
    expect(summary.manualSummary).toEqual({
      totalCount: 0,
      dueCount: 0,
      dueEntries: [],
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
      "routines",
      "projects",
      "inbox",
      "journal",
      "knowledge",
      "decisions",
      "goals",
      "lifeAreas",
      "manual",
      "finance",
      "wellness",
    ]);
    expect(summary.hasAnyData).toBe(false);
  });

  it("derives a safe Goal → Project → Task planning chain without mutating manual Goal progress", () => {
    const goal = createGoal("goal", { progressPercent: 42 });
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [
          createTask("done", { projectId: "project", status: "done" }),
          createTask("open", { projectId: "project", status: "todo" }),
          createTask("unrelated", { projectId: "other", status: "done" }),
        ],
        projects: [
          createProject("project", { goalId: goal.id, nextAction: undefined }),
          createProject("orphaned", { goalId: "deleted-goal", nextAction: "Keep moving" }),
        ],
        goals: [goal],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.planningSummary).toMatchObject({
      linkedProjectCount: 2,
      linkedTaskCount: 2,
      completedLinkedTaskCount: 1,
      openLinkedTaskCount: 1,
      completionPercent: 50,
      unavailableGoalProjectCount: 1,
    });
    expect(summary.planningSummary.attentionEntries[0]).toMatchObject({
      project: { id: "project" },
      goal: { id: goal.id, progressPercent: 42 },
      openTaskCount: 1,
    });
    expect(goal.progressPercent).toBe(42);
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
        goals: [],
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
        manualEntries: [],
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
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
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
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
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
      goals: [],
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
      manualEntries: [],
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

  it("includes only active manual entries that are due for review", () => {
    const referenceDate = new Date(2026, 6, 12);
    const dueActive = createManualEntry("due-active", {
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const dueDraft = createManualEntry("due-draft", {
      status: "draft",
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const dueArchived = createManualEntry("due-archived", {
      status: "archived",
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const notDueActive = createManualEntry("not-due-active", {
      updatedAt: "2026-07-09T08:30:00.000Z",
      reviewIntervalDays: 7,
    });

    const dueEntries = getWeeklyReviewManualDueEntries(
      [notDueActive, dueArchived, dueActive, dueDraft],
      referenceDate
    );

    expect(dueEntries.map((entry) => entry.id)).toEqual(["due-active"]);

    const summary = buildWeeklyReviewSummary(
      {
        tasks: [],
        projects: [],
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [notDueActive, dueArchived, dueActive, dueDraft],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      referenceDate
    );

    expect(summary.manualSummary).toEqual({
      totalCount: 4,
      dueCount: 1,
      dueEntries: [dueActive],
    });
    expect(summary.emptyStates.map((item) => item.sectionId)).not.toContain(
      "manual"
    );
  });

  it("shows the manual empty state when nothing is due", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [],
        projects: [],
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [
          createManualEntry("fresh", {
            updatedAt: "2026-07-10T08:30:00.000Z",
            reviewIntervalDays: 7,
          }),
          createManualEntry("draft", {
            status: "draft",
            updatedAt: "2026-07-04T08:30:00.000Z",
            reviewIntervalDays: 7,
          }),
        ],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.manualSummary.dueCount).toBe(0);
    expect(summary.emptyStates.map((item) => item.sectionId)).toContain("manual");
  });

  it("includes only active goals that are due for review", () => {
    const referenceDate = new Date(2026, 6, 12);
    const dueGoal = createGoal("due-goal", {
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const pausedGoal = createGoal("paused-goal", {
      status: "paused",
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const freshGoal = createGoal("fresh-goal", {
      updatedAt: "2026-07-10T08:30:00.000Z",
      reviewIntervalDays: 7,
    });

    const dueGoals = getReviewDueGoals([freshGoal, pausedGoal, dueGoal], referenceDate);

    expect(dueGoals.map((goal) => goal.id)).toEqual(["due-goal"]);

    const summary = buildWeeklyReviewSummary(
      {
        tasks: [],
        projects: [],
        goals: [freshGoal, pausedGoal, dueGoal],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      referenceDate
    );

    expect(summary.goalSummary).toEqual({
      totalCount: 3,
      dueCount: 1,
      dueEntries: [dueGoal],
    });
    expect(summary.emptyStates.map((item) => item.sectionId)).not.toContain(
      "goals"
    );
  });

  it("includes only active life areas that are due for review", () => {
    const referenceDate = new Date(2026, 6, 12);
    const dueLifeArea = createLifeArea("due-life-area", {
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const pausedLifeArea = createLifeArea("paused-life-area", {
      status: "paused",
      updatedAt: "2026-07-04T08:30:00.000Z",
      reviewIntervalDays: 7,
    });
    const freshLifeArea = createLifeArea("fresh-life-area", {
      updatedAt: "2026-07-10T08:30:00.000Z",
      reviewIntervalDays: 7,
    });

    const summary = buildWeeklyReviewSummary(
      {
        tasks: [],
        projects: [],
        goals: [],
        lifeAreas: [freshLifeArea, pausedLifeArea, dueLifeArea],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      referenceDate
    );

    expect(summary.lifeAreaSummary).toEqual({
      totalCount: 3,
      activeCount: 2,
      highAttentionActiveCount: 0,
      dueCount: 1,
      dueEntries: [dueLifeArea],
    });
    expect(summary.emptyStates.map((item) => item.sectionId)).not.toContain(
      "lifeAreas"
    );
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
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
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

  it("summarizes only explicitly added routine tasks in the review window", () => {
    const summary = buildWeeklyReviewSummary(
      {
        tasks: [
          createTask("routine-done", {
            routineId: "morning-review",
            dueDate: "2026-07-08",
            status: "done",
            completedAt: "2026-07-08T10:00:00.000Z",
          }),
          createTask("routine-open", {
            routineId: "morning-review",
            dueDate: "2026-07-10",
            status: "doing",
          }),
          createTask("routine-outside-window", {
            routineId: "morning-review",
            dueDate: "2026-07-03",
            status: "done",
          }),
          createTask("ordinary-task", {
            dueDate: "2026-07-09",
            status: "done",
          }),
        ],
        projects: [],
        goals: [],
        inboxItems: [],
        journalEntries: [],
        knowledgeItems: [],
        decisionLogEntries: [],
        manualEntries: [],
        financeTransactions: [],
        financeObligations: [],
        dailyCheckins: [],
      },
      new Date(2026, 6, 10)
    );

    expect(summary.routineSummary).toEqual({
      linkedTaskCount: 3,
      plannedInWindowCount: 2,
      completedInWindowCount: 1,
      openInWindowCount: 1,
      completionPercent: 50,
    });
    expect(summary.emptyStates.map((item) => item.sectionId)).not.toContain(
      "routines"
    );
  });
});
