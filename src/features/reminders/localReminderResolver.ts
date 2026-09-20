import { compareAsc, format, parseISO, startOfDay } from "date-fns";

import type { FinanceObligation, Task } from "@/shared/types";

export type LocalReminderKind =
  | "task_due_today"
  | "task_overdue"
  | "finance_due_today"
  | "finance_overdue";

export type LocalTaskReminder = Readonly<{
  id: string;
  kind: "task_due_today" | "task_overdue";
  task: Task;
  dueDate: string;
}>;

export type LocalFinanceReminder = Readonly<{
  id: string;
  kind: "finance_due_today" | "finance_overdue";
  obligation: FinanceObligation;
  dueDate: string;
}>;

export type LocalReminderSnapshot = Readonly<{
  dueTodayTasks: LocalTaskReminder[];
  overdueTasks: LocalTaskReminder[];
  dueTodayObligations: LocalFinanceReminder[];
  overdueObligations: LocalFinanceReminder[];
  totalCount: number;
  hasAnyReminder: boolean;
  signature: string;
}>;

const openTaskStatuses = new Set<Task["status"]>([
  "todo",
  "doing",
  "deferred",
]);

const priorityRank: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function parseDateOnly(value: string): Date | null {
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function compareDateOnly(left: string, right: string): number {
  const leftDate = parseDateOnly(left);
  const rightDate = parseDateOnly(right);

  if (leftDate && rightDate) {
    return compareAsc(leftDate, rightDate);
  }

  if (leftDate) return -1;
  if (rightDate) return 1;
  return left.localeCompare(right);
}

function isOpenTask(task: Task): boolean {
  return openTaskStatuses.has(task.status);
}

function isActiveUnpaidObligation(obligation: FinanceObligation): boolean {
  return (
    obligation.status === "active" &&
    obligation.paidAmount < obligation.totalAmount
  );
}

function compareTaskReminders(
  left: LocalTaskReminder,
  right: LocalTaskReminder
): number {
  return (
    compareDateOnly(left.dueDate, right.dueDate) ||
    priorityRank[left.task.priority] - priorityRank[right.task.priority] ||
    right.task.updatedAt.localeCompare(left.task.updatedAt) ||
    left.task.title.localeCompare(right.task.title)
  );
}

function compareFinanceReminders(
  left: LocalFinanceReminder,
  right: LocalFinanceReminder
): number {
  return (
    compareDateOnly(left.dueDate, right.dueDate) ||
    right.obligation.updatedAt.localeCompare(left.obligation.updatedAt) ||
    left.obligation.title.localeCompare(right.obligation.title)
  );
}

export function buildLocalReminderSnapshot(
  tasks: ReadonlyArray<Task>,
  obligations: ReadonlyArray<FinanceObligation>,
  referenceDate = new Date()
): LocalReminderSnapshot {
  const today = format(referenceDate, "yyyy-MM-dd");
  const todayDayOfMonth = referenceDate.getDate();
  const todayDate = startOfDay(referenceDate);

  const dueTodayTasks: LocalTaskReminder[] = [];
  const overdueTasks: LocalTaskReminder[] = [];

  for (const task of tasks) {
    if (!isOpenTask(task) || !task.dueDate) {
      continue;
    }

    const taskDueDate = parseDateOnly(task.dueDate);
    if (!taskDueDate) {
      continue;
    }

    if (task.dueDate === today) {
      dueTodayTasks.push({
        id: `task:${task.id}:due_today`,
        kind: "task_due_today",
        task,
        dueDate: task.dueDate,
      });
    } else if (taskDueDate.getTime() < todayDate.getTime()) {
      overdueTasks.push({
        id: `task:${task.id}:overdue`,
        kind: "task_overdue",
        task,
        dueDate: task.dueDate,
      });
    }
  }

  const dueTodayObligations: LocalFinanceReminder[] = [];
  const overdueObligations: LocalFinanceReminder[] = [];

  for (const obligation of obligations) {
    if (!isActiveUnpaidObligation(obligation)) {
      continue;
    }

    if (obligation.dueDate) {
      const obligationDueDate = parseDateOnly(obligation.dueDate);
      if (!obligationDueDate) {
        continue;
      }

      if (obligation.dueDate === today) {
        dueTodayObligations.push({
          id: `finance:${obligation.id}:due_today`,
          kind: "finance_due_today",
          obligation,
          dueDate: obligation.dueDate,
        });
      } else if (obligationDueDate.getTime() < todayDate.getTime()) {
        overdueObligations.push({
          id: `finance:${obligation.id}:overdue`,
          kind: "finance_overdue",
          obligation,
          dueDate: obligation.dueDate,
        });
      }

      continue;
    }

    if (obligation.dueDay === todayDayOfMonth) {
      dueTodayObligations.push({
        id: `finance:${obligation.id}:due_today`,
        kind: "finance_due_today",
        obligation,
        dueDate: today,
      });
    }
  }

  dueTodayTasks.sort(compareTaskReminders);
  overdueTasks.sort(compareTaskReminders);
  dueTodayObligations.sort(compareFinanceReminders);
  overdueObligations.sort(compareFinanceReminders);

  const allIds = [
    ...overdueTasks,
    ...dueTodayTasks,
    ...overdueObligations,
    ...dueTodayObligations,
  ].map((item) => item.id);
  const totalCount = allIds.length;

  return {
    dueTodayTasks,
    overdueTasks,
    dueTodayObligations,
    overdueObligations,
    totalCount,
    hasAnyReminder: totalCount > 0,
    signature: allIds.join("|"),
  };
}
