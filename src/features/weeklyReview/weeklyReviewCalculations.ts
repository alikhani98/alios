import {
  addDays,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

import type {
  DailyCheckin,
  DecisionLogEntry,
  Goal,
  FinanceObligation,
  FinanceTransaction,
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  ManualEntry,
  Project,
  Task,
} from "@/shared/types";

import {
  calculateMonthlyObligationEstimate,
  calculateRemainingObligationTotal,
  getUpcomingObligations,
} from "../finance/financeCalculations";
import { getReviewDueGoals } from "../goals";
import {
  getHighAttentionLifeAreas,
  getReviewDueLifeAreas,
  type LifeAreaView,
} from "../lifeAreas";
import { isManualEntryReviewDue } from "../manual/manualEntries";
import { isProjectReviewDue } from "../projects/projectReviews";
import { isDecisionNeedsReview } from "../decisions/decisionLog";

export type WeeklyReviewWindow = {
  days: number;
  startDate: string;
  endDate: string;
};

export type WeeklyReviewTaskSummary = {
  totalCount: number;
  completedCount: number;
  openCount: number;
  overdueCount: number;
  dueSoonCount: number;
  completedInWindowCount: number;
};

export type WeeklyReviewRoutineSummary = {
  linkedTaskCount: number;
  plannedInWindowCount: number;
  completedInWindowCount: number;
  openInWindowCount: number;
  completionPercent: number;
};

export type WeeklyReviewProjectSummary = {
  totalCount: number;
  activeCount: number;
  projectsWithNextActionCount: number;
  needsAttentionCount: number;
  reviewDueEntries: Project[];
};

export type WeeklyReviewPlanningAttentionEntry = {
  project: Project;
  goal?: Goal;
  openTaskCount: number;
};

export type WeeklyReviewPlanningSummary = {
  linkedProjectCount: number;
  linkedTaskCount: number;
  completedLinkedTaskCount: number;
  openLinkedTaskCount: number;
  completionPercent: number;
  unavailableGoalProjectCount: number;
  attentionEntries: WeeklyReviewPlanningAttentionEntry[];
};

export type WeeklyReviewInboxSummary = {
  totalCount: number;
  pendingCount: number;
  processedCount: number;
  capturedInWindowCount: number;
};

export type WeeklyReviewJournalSummary = {
  totalCount: number;
  entriesInWindowCount: number;
  averageMoodLevel: number | null;
  averageEnergyLevel: number | null;
};

export type WeeklyReviewKnowledgeSummary = {
  totalCount: number;
  createdInWindowCount: number;
};

export type WeeklyReviewDecisionSummary = {
  totalCount: number;
  createdInWindowCount: number;
  needsReviewCount: number;
  reviewedInWindowCount: number;
  dueEntries: DecisionLogEntry[];
};

export type WeeklyReviewGoalSummary = {
  totalCount: number;
  dueCount: number;
  dueEntries: Goal[];
};

export type WeeklyReviewLifeAreaSummary = {
  totalCount: number;
  activeCount: number;
  highAttentionActiveCount: number;
  dueCount: number;
  dueEntries: LifeAreaView[];
};

export type WeeklyReviewManualSummary = {
  totalCount: number;
  dueCount: number;
  dueEntries: ManualEntry[];
};

export type WeeklyReviewFinanceSummary = {
  transactionCount: number;
  incomeInWindow: number;
  expensesInWindow: number;
  netCashflowInWindow: number;
  activeObligationsCount: number;
  upcomingObligationsCount: number;
  remainingObligationTotal: number;
  monthlyObligationsEstimate: number;
};

export type WeeklyReviewWellnessSummary = {
  checkinCountInWindow: number;
  notesCountInWindow: number;
  averageMoodLevel: number | null;
  averageEnergyLevel: number | null;
};

export type WeeklyReviewSectionId =
  | "tasks"
  | "routines"
  | "projects"
  | "inbox"
  | "journal"
  | "knowledge"
  | "decisions"
  | "goals"
  | "lifeAreas"
  | "manual"
  | "finance"
  | "wellness";

export type WeeklyReviewEmptyState = {
  sectionId: WeeklyReviewSectionId;
};

export type WeeklyReviewObservationTone =
  | "awareness"
  | "needs-review"
  | "good-signal";

export type WeeklyReviewObservationKind =
  | "overdueTasks"
  | "pendingInbox"
  | "journalReflection"
  | "financeBalance"
  | "projectProgress"
  | "decisionReview"
  | "goalReview"
  | "lifeAreaReview"
  | "lifeAreaAttention"
  | "wellnessCheckins"
  | "noData";

export type WeeklyReviewObservation = {
  kind: WeeklyReviewObservationKind;
  tone: WeeklyReviewObservationTone;
  count?: number;
  amount?: number;
};

export type WeeklyReviewFocusKind =
  | "processInbox"
  | "reviewOverdueTasks"
  | "writeJournalEntry"
  | "recordFinanceData"
  | "reviewDecisions"
  | "reviewLifeAreas"
  | "reviewGoals"
  | "refineProjectNextAction"
  | "addFirstTask";

export type WeeklyReviewFocusSuggestion = {
  kind: WeeklyReviewFocusKind;
  tone: "next-focus";
};

export type WeeklyReviewSummary = {
  reviewWindow: WeeklyReviewWindow;
  taskSummary: WeeklyReviewTaskSummary;
  routineSummary: WeeklyReviewRoutineSummary;
  projectSummary: WeeklyReviewProjectSummary;
  planningSummary: WeeklyReviewPlanningSummary;
  inboxSummary: WeeklyReviewInboxSummary;
  journalSummary: WeeklyReviewJournalSummary;
  knowledgeSummary: WeeklyReviewKnowledgeSummary;
  decisionSummary: WeeklyReviewDecisionSummary;
  goalSummary: WeeklyReviewGoalSummary;
  lifeAreaSummary: WeeklyReviewLifeAreaSummary;
  manualSummary: WeeklyReviewManualSummary;
  financeSummary: WeeklyReviewFinanceSummary;
  wellnessSummary: WeeklyReviewWellnessSummary;
  focusObservations: WeeklyReviewObservation[];
  suggestedFocus: WeeklyReviewFocusSuggestion[];
  emptyStates: WeeklyReviewEmptyState[];
  hasAnyData: boolean;
};

export type WeeklyReviewData = {
  tasks: ReadonlyArray<Task>;
  projects: ReadonlyArray<Project>;
  inboxItems: ReadonlyArray<InboxItem>;
  journalEntries: ReadonlyArray<JournalEntry>;
  knowledgeItems: ReadonlyArray<KnowledgeItem>;
  decisionLogEntries: ReadonlyArray<DecisionLogEntry>;
  goals: ReadonlyArray<Goal>;
  lifeAreas?: ReadonlyArray<LifeAreaView>;
  manualEntries: ReadonlyArray<ManualEntry>;
  financeTransactions: ReadonlyArray<FinanceTransaction>;
  financeObligations: ReadonlyArray<FinanceObligation>;
  dailyCheckins: ReadonlyArray<DailyCheckin>;
};

type ReviewWindowBoundaries = {
  start: Date;
  end: Date;
  upcomingStart: Date;
  upcomingEnd: Date;
};

const LEVEL_MAP: Record<"low" | "medium" | "good", number> = {
  low: 1,
  medium: 2,
  good: 3,
};

function parseDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function isWithinRange(value: string, start: Date, end: Date): boolean {
  const parsed = parseDate(value);
  return parsed !== null && parsed.getTime() >= start.getTime() && parsed.getTime() <= end.getTime();
}

function isOpenTask(task: Task): boolean {
  return task.status !== "done" && task.status !== "cancelled";
}

function isTaskCompleted(task: Task): boolean {
  return task.status === "done";
}

function getWeeklyReviewBoundaries(referenceDate: Date): ReviewWindowBoundaries {
  const start = startOfDay(subDays(referenceDate, 6));
  const end = endOfDay(referenceDate);
  const upcomingStart = startOfDay(addDays(referenceDate, 1));
  const upcomingEnd = endOfDay(addDays(referenceDate, 7));

  return {
    start,
    end,
    upcomingStart,
    upcomingEnd,
  };
}

export function getWeeklyReviewWindow(referenceDate = new Date()): WeeklyReviewWindow {
  const boundaries = getWeeklyReviewBoundaries(referenceDate);

  return {
    days: 7,
    startDate: format(boundaries.start, "yyyy-MM-dd"),
    endDate: format(boundaries.end, "yyyy-MM-dd"),
  };
}

function calculateAverageLevel(
  values: ReadonlyArray<"low" | "medium" | "good">
): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + LEVEL_MAP[value], 0);
  return total / values.length;
}

function getTaskCompletionTimestamp(task: Task): Date | null {
  const source = task.completedAt ?? task.updatedAt;
  return parseDate(source);
}

function isTaskDueSoon(task: Task, boundaries: ReviewWindowBoundaries): boolean {
  if (!isOpenTask(task) || !task.dueDate) {
    return false;
  }

  const parsedDueDate = parseDate(task.dueDate);
  return (
    parsedDueDate !== null &&
    parsedDueDate.getTime() >= boundaries.upcomingStart.getTime() &&
    parsedDueDate.getTime() <= boundaries.upcomingEnd.getTime()
  );
}

function isTaskOverdue(task: Task, referenceDate: Date): boolean {
  if (!isOpenTask(task) || !task.dueDate) {
    return false;
  }

  const parsedDueDate = parseDate(task.dueDate);
  return parsedDueDate !== null && parsedDueDate.getTime() < startOfDay(referenceDate).getTime();
}

function hasProjectNextAction(project: Project): boolean {
  return project.nextAction !== undefined && project.nextAction.trim().length > 0;
}

export function getWeeklyReviewManualDueEntries(
  entries: ReadonlyArray<ManualEntry>,
  referenceDate = new Date()
): ManualEntry[] {
  return entries
    .filter(
      (entry) =>
        entry.status === "active" &&
        isManualEntryReviewDue(entry, referenceDate)
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function needsProjectAttention(project: Project, referenceDate: Date): boolean {
  if (project.status !== "active") {
    return false;
  }

  const hasNextAction = hasProjectNextAction(project);
  if (!hasNextAction) {
    return true;
  }

  return isProjectReviewDue(project, referenceDate);
}

function buildEmptyStates(summary: {
  taskSummary: WeeklyReviewTaskSummary;
  routineSummary: WeeklyReviewRoutineSummary;
  projectSummary: WeeklyReviewProjectSummary;
  planningSummary: WeeklyReviewPlanningSummary;
  inboxSummary: WeeklyReviewInboxSummary;
  journalSummary: WeeklyReviewJournalSummary;
  knowledgeSummary: WeeklyReviewKnowledgeSummary;
  decisionSummary: WeeklyReviewDecisionSummary;
  goalSummary: WeeklyReviewGoalSummary;
  lifeAreaSummary: WeeklyReviewLifeAreaSummary;
  manualSummary: WeeklyReviewManualSummary;
  financeSummary: WeeklyReviewFinanceSummary;
  wellnessSummary: WeeklyReviewWellnessSummary;
}): WeeklyReviewEmptyState[] {
  const emptyStates: WeeklyReviewEmptyState[] = [];

  if (summary.taskSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "tasks" });
  }

  if (summary.routineSummary.plannedInWindowCount === 0) {
    emptyStates.push({ sectionId: "routines" });
  }

  if (summary.projectSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "projects" });
  }

  if (summary.inboxSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "inbox" });
  }

  if (summary.journalSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "journal" });
  }

  if (summary.knowledgeSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "knowledge" });
  }

  if (summary.decisionSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "decisions" });
  }

  if (summary.goalSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "goals" });
  }

  if (summary.lifeAreaSummary.totalCount === 0) {
    emptyStates.push({ sectionId: "lifeAreas" });
  }

  if (summary.manualSummary.dueCount === 0) {
    emptyStates.push({ sectionId: "manual" });
  }

  if (
    summary.financeSummary.transactionCount === 0 &&
    summary.financeSummary.activeObligationsCount === 0
  ) {
    emptyStates.push({ sectionId: "finance" });
  }

  if (summary.wellnessSummary.checkinCountInWindow === 0) {
    emptyStates.push({ sectionId: "wellness" });
  }

  return emptyStates;
}

function buildObservations(summary: WeeklyReviewSummary): WeeklyReviewObservation[] {
  const observations: WeeklyReviewObservation[] = [];

  if (summary.taskSummary.overdueCount > 0) {
    observations.push({
      kind: "overdueTasks",
      tone: "needs-review",
      count: summary.taskSummary.overdueCount,
    });
  }

  if (summary.inboxSummary.pendingCount > 0) {
    observations.push({
      kind: "pendingInbox",
      tone: "needs-review",
      count: summary.inboxSummary.pendingCount,
    });
  }

  if (summary.journalSummary.entriesInWindowCount > 0) {
    observations.push({
      kind: "journalReflection",
      tone: "good-signal",
      count: summary.journalSummary.entriesInWindowCount,
    });
  }

  if (
    summary.financeSummary.transactionCount > 0 &&
    summary.financeSummary.expensesInWindow > summary.financeSummary.incomeInWindow
  ) {
    observations.push({
      kind: "financeBalance",
      tone: "awareness",
      amount: summary.financeSummary.expensesInWindow - summary.financeSummary.incomeInWindow,
    });
  }

  if (summary.projectSummary.projectsWithNextActionCount > 0) {
    observations.push({
      kind: "projectProgress",
      tone: "good-signal",
      count: summary.projectSummary.projectsWithNextActionCount,
    });
  }

  if (summary.decisionSummary.needsReviewCount > 0) {
    observations.push({
      kind: "decisionReview",
      tone: "needs-review",
      count: summary.decisionSummary.needsReviewCount,
    });
  }

  if (summary.goalSummary.dueCount > 0) {
    observations.push({
      kind: "goalReview",
      tone: "needs-review",
      count: summary.goalSummary.dueCount,
    });
  }

  if (summary.lifeAreaSummary.dueCount > 0) {
    observations.push({
      kind: "lifeAreaReview",
      tone: "needs-review",
      count: summary.lifeAreaSummary.dueCount,
    });
  }

  if (summary.lifeAreaSummary.highAttentionActiveCount > 0) {
    observations.push({
      kind: "lifeAreaAttention",
      tone: "awareness",
      count: summary.lifeAreaSummary.highAttentionActiveCount,
    });
  }

  if (summary.wellnessSummary.checkinCountInWindow > 0) {
    observations.push({
      kind: "wellnessCheckins",
      tone: "good-signal",
      count: summary.wellnessSummary.checkinCountInWindow,
    });
  }

  if (observations.length === 0) {
    observations.push({
      kind: "noData",
      tone: "awareness",
    });
  }

  return observations.slice(0, 4);
}

function buildSuggestedFocus(summary: WeeklyReviewSummary): WeeklyReviewFocusSuggestion[] {
  if (!summary.hasAnyData) {
    return [{ kind: "addFirstTask", tone: "next-focus" }];
  }

  if (summary.inboxSummary.pendingCount > 0) {
    return [{ kind: "processInbox", tone: "next-focus" }];
  }

  if (summary.taskSummary.overdueCount > 0) {
    return [{ kind: "reviewOverdueTasks", tone: "next-focus" }];
  }

  if (summary.journalSummary.entriesInWindowCount === 0) {
    return [{ kind: "writeJournalEntry", tone: "next-focus" }];
  }

  if (summary.decisionSummary.needsReviewCount > 0) {
    return [{ kind: "reviewDecisions", tone: "next-focus" }];
  }

  if (summary.goalSummary.dueCount > 0) {
    return [{ kind: "reviewGoals", tone: "next-focus" }];
  }

  if (summary.lifeAreaSummary.dueCount > 0) {
    return [{ kind: "reviewLifeAreas", tone: "next-focus" }];
  }

  if (summary.financeSummary.transactionCount === 0) {
    return [{ kind: "recordFinanceData", tone: "next-focus" }];
  }

  if (summary.projectSummary.needsAttentionCount > 0) {
    return [{ kind: "refineProjectNextAction", tone: "next-focus" }];
  }

  return [{ kind: "addFirstTask", tone: "next-focus" }];
}

function getMeanLevel(values: Array<"low" | "medium" | "good">): number | null {
  return calculateAverageLevel(values);
}

export function buildWeeklyReviewSummary(
  data: WeeklyReviewData,
  referenceDate = new Date()
): WeeklyReviewSummary {
  const boundaries = getWeeklyReviewBoundaries(referenceDate);
  const reviewWindow = getWeeklyReviewWindow(referenceDate);
  const financeTransactions = [...data.financeTransactions];
  const financeObligations = [...data.financeObligations];

  const taskSummary: WeeklyReviewTaskSummary = {
    totalCount: data.tasks.length,
    completedCount: data.tasks.filter(isTaskCompleted).length,
    openCount: data.tasks.filter(isOpenTask).length,
    overdueCount: data.tasks.filter((task) => isTaskOverdue(task, referenceDate)).length,
    dueSoonCount: data.tasks.filter((task) => isTaskDueSoon(task, boundaries)).length,
    completedInWindowCount: data.tasks.filter((task) => {
      if (!isTaskCompleted(task)) {
        return false;
      }

      const completedAt = getTaskCompletionTimestamp(task);
      return completedAt !== null && completedAt.getTime() >= boundaries.start.getTime() && completedAt.getTime() <= boundaries.end.getTime();
    }).length,
  };

  const routineTasks = data.tasks.filter((task) => Boolean(task.routineId));
  const routineTasksInWindow = routineTasks.filter(
    (task) =>
      task.dueDate !== undefined &&
      isWithinRange(task.dueDate, boundaries.start, boundaries.end)
  );
  const completedRoutineTasksInWindow = routineTasksInWindow.filter(isTaskCompleted);
  const routineSummary: WeeklyReviewRoutineSummary = {
    linkedTaskCount: routineTasks.length,
    plannedInWindowCount: routineTasksInWindow.length,
    completedInWindowCount: completedRoutineTasksInWindow.length,
    openInWindowCount: routineTasksInWindow.filter(isOpenTask).length,
    completionPercent:
      routineTasksInWindow.length === 0
        ? 0
        : Math.round(
            (completedRoutineTasksInWindow.length / routineTasksInWindow.length) * 100
          ),
  };

  const projectSummary: WeeklyReviewProjectSummary = {
    totalCount: data.projects.length,
    activeCount: data.projects.filter((project) => project.status === "active").length,
    projectsWithNextActionCount: data.projects.filter(
      (project) => project.status === "active" && hasProjectNextAction(project)
    ).length,
    needsAttentionCount: data.projects.filter((project) =>
      needsProjectAttention(project, referenceDate)
    ).length,
    reviewDueEntries: data.projects
      .filter((project) => isProjectReviewDue(project, referenceDate))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };

  const goalsById = new Map(data.goals.map((goal) => [goal.id, goal]));
  const linkedProjects = data.projects.filter((project) => Boolean(project.goalId));
  const linkedProjectIds = new Set(linkedProjects.map((project) => project.id));
  const linkedTasks = data.tasks.filter(
    (task) => task.projectId && linkedProjectIds.has(task.projectId)
  );
  const completedLinkedTaskCount = linkedTasks.filter(isTaskCompleted).length;
  const attentionEntries = linkedProjects
    .filter((project) => needsProjectAttention(project, referenceDate))
    .map((project) => ({
      project,
      goal: project.goalId ? goalsById.get(project.goalId) : undefined,
      openTaskCount: linkedTasks.filter(
        (task) => task.projectId === project.id && isOpenTask(task)
      ).length,
    }))
    .sort((left, right) => right.project.updatedAt.localeCompare(left.project.updatedAt));
  const planningSummary: WeeklyReviewPlanningSummary = {
    linkedProjectCount: linkedProjects.length,
    linkedTaskCount: linkedTasks.length,
    completedLinkedTaskCount,
    openLinkedTaskCount: linkedTasks.filter(isOpenTask).length,
    completionPercent:
      linkedTasks.length === 0
        ? 0
        : Math.round((completedLinkedTaskCount / linkedTasks.length) * 100),
    unavailableGoalProjectCount: linkedProjects.filter(
      (project) => project.goalId && !goalsById.has(project.goalId)
    ).length,
    attentionEntries: attentionEntries.slice(0, 4),
  };

  const inboxSummary: WeeklyReviewInboxSummary = {
    totalCount: data.inboxItems.length,
    pendingCount: data.inboxItems.filter((item) => item.status === "unprocessed").length,
    processedCount: data.inboxItems.filter((item) => item.status === "processed").length,
    capturedInWindowCount: data.inboxItems.filter((item) =>
      isWithinRange(item.createdAt, boundaries.start, boundaries.end)
    ).length,
  };

  const journalMoodValues = data.journalEntries
    .filter((entry) => isWithinRange(entry.date, boundaries.start, boundaries.end))
    .flatMap((entry) => (entry.moodLevel ? [entry.moodLevel] : []));
  const journalEnergyValues = data.journalEntries
    .filter((entry) => isWithinRange(entry.date, boundaries.start, boundaries.end))
    .flatMap((entry) => (entry.energyLevel ? [entry.energyLevel] : []));
  const journalEntriesInWindow = data.journalEntries.filter((entry) =>
    isWithinRange(entry.date, boundaries.start, boundaries.end)
  );

  const journalSummary: WeeklyReviewJournalSummary = {
    totalCount: data.journalEntries.length,
    entriesInWindowCount: journalEntriesInWindow.length,
    averageMoodLevel: getMeanLevel(journalMoodValues),
    averageEnergyLevel: getMeanLevel(journalEnergyValues),
  };

  const knowledgeSummary: WeeklyReviewKnowledgeSummary = {
    totalCount: data.knowledgeItems.length,
    createdInWindowCount: data.knowledgeItems.filter((item) =>
      isWithinRange(item.createdAt, boundaries.start, boundaries.end)
    ).length,
  };

  const decisionEntriesInWindow = data.decisionLogEntries.filter((entry) =>
    isWithinRange(entry.createdAt, boundaries.start, boundaries.end)
  );
  const dueDecisions = data.decisionLogEntries
    .filter((entry) => isDecisionNeedsReview(entry, referenceDate))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const decisionSummary: WeeklyReviewDecisionSummary = {
    totalCount: data.decisionLogEntries.length,
    createdInWindowCount: decisionEntriesInWindow.length,
    needsReviewCount: dueDecisions.length,
    reviewedInWindowCount: data.decisionLogEntries.filter((entry) => {
      if (entry.status !== "reviewed") {
        return false;
      }

      const hasReflection = Boolean(
        entry.actualOutcome?.trim().length || entry.lesson?.trim().length
      );

      return hasReflection && isWithinRange(entry.updatedAt, boundaries.start, boundaries.end);
    }).length,
    dueEntries: dueDecisions,
  };

  const dueGoals = getReviewDueGoals(data.goals, referenceDate);
  const goalSummary: WeeklyReviewGoalSummary = {
    totalCount: data.goals.length,
    dueCount: dueGoals.length,
    dueEntries: dueGoals,
  };

  const lifeAreas = data.lifeAreas ?? [];
  const dueLifeAreas = getReviewDueLifeAreas(lifeAreas, referenceDate);
  const lifeAreaSummary: WeeklyReviewLifeAreaSummary = {
    totalCount: lifeAreas.length,
    activeCount: lifeAreas.filter((area) => area.status === "active").length,
    highAttentionActiveCount: getHighAttentionLifeAreas(lifeAreas).length,
    dueCount: dueLifeAreas.length,
    dueEntries: dueLifeAreas,
  };

  const manualDueEntries = getWeeklyReviewManualDueEntries(
    data.manualEntries,
    referenceDate
  );
  const manualSummary: WeeklyReviewManualSummary = {
    totalCount: data.manualEntries.length,
    dueCount: manualDueEntries.length,
    dueEntries: manualDueEntries,
  };

  const upcomingObligations = getUpcomingObligations(
    financeObligations,
    referenceDate
  );
  const weeklyTransactions = financeTransactions.filter((transaction) =>
    isWithinRange(transaction.occurredAt, boundaries.start, boundaries.end)
  );
  const incomeInWindow = weeklyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expensesInWindow = weeklyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const financeSummary: WeeklyReviewFinanceSummary = {
    transactionCount: weeklyTransactions.length,
    incomeInWindow,
    expensesInWindow,
    netCashflowInWindow: incomeInWindow - expensesInWindow,
    activeObligationsCount: financeObligations.filter((obligation) => obligation.status === "active").length,
    upcomingObligationsCount: upcomingObligations.filter((item) => item.label === "dueSoon").length,
    remainingObligationTotal: calculateRemainingObligationTotal(financeObligations),
    monthlyObligationsEstimate: calculateMonthlyObligationEstimate(
      financeObligations,
      referenceDate
    ),
  };

  const wellnessCheckinsInWindow = data.dailyCheckins.filter((checkin) =>
    isWithinRange(checkin.date, boundaries.start, boundaries.end)
  );
  const wellnessMoodValues = wellnessCheckinsInWindow.flatMap((checkin) =>
    checkin.moodLevel ? [checkin.moodLevel] : []
  );
  const wellnessEnergyValues = wellnessCheckinsInWindow.flatMap((checkin) =>
    checkin.energyLevel ? [checkin.energyLevel] : []
  );

  const wellnessSummary: WeeklyReviewWellnessSummary = {
    checkinCountInWindow: wellnessCheckinsInWindow.length,
    notesCountInWindow: wellnessCheckinsInWindow.filter(
      (checkin) => checkin.notes?.trim().length
    ).length,
    averageMoodLevel: getMeanLevel(wellnessMoodValues),
    averageEnergyLevel: getMeanLevel(wellnessEnergyValues),
  };

  const summary: WeeklyReviewSummary = {
    reviewWindow,
    taskSummary,
    routineSummary,
    projectSummary,
    planningSummary,
    inboxSummary,
    journalSummary,
    knowledgeSummary,
    decisionSummary,
    goalSummary,
    lifeAreaSummary,
    manualSummary,
    financeSummary,
    wellnessSummary,
    focusObservations: [],
    suggestedFocus: [],
    emptyStates: [],
    hasAnyData: false,
  };

  summary.hasAnyData =
    summary.taskSummary.totalCount > 0 ||
    summary.routineSummary.linkedTaskCount > 0 ||
    summary.projectSummary.totalCount > 0 ||
    summary.inboxSummary.totalCount > 0 ||
    summary.journalSummary.totalCount > 0 ||
    summary.knowledgeSummary.totalCount > 0 ||
    summary.decisionSummary.totalCount > 0 ||
    summary.goalSummary.totalCount > 0 ||
    summary.lifeAreaSummary.totalCount > 0 ||
    summary.manualSummary.totalCount > 0 ||
    summary.financeSummary.transactionCount > 0 ||
    summary.financeSummary.activeObligationsCount > 0 ||
    summary.wellnessSummary.checkinCountInWindow > 0;
  summary.focusObservations = buildObservations(summary);
  summary.suggestedFocus = buildSuggestedFocus(summary);
  summary.emptyStates = buildEmptyStates(summary);

  return summary;
}
