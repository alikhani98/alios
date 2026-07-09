import {
  addMonths,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isValid,
  parseISO,
} from "date-fns";

import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

type FinanceSummary = {
  incomeThisMonth: number;
  expensesThisMonth: number;
  monthlyObligationsEstimate: number;
  remainingLiquidity: number;
  totalRemainingObligation: number;
};

export type FinanceExpenseCategoryBreakdown = {
  category: string;
  amount: number;
  transactionCount: number;
  percentageOfExpenses: number;
};

export type FinanceExpenseCategoryChartData = FinanceExpenseCategoryBreakdown;

export type FinanceCashflowSeriesPoint = {
  monthKey: string;
  monthStart: string;
  income: number;
  expenses: number;
  obligations: number;
  remainingLiquidity: number;
};

export type FinanceMonthLabelLocale = "en-US" | "fa-IR";
export type FinanceMonthLabelCalendar = "gregory" | "persian";

export type FinanceBudgetGuardStatus = "calm" | "watch" | "pressure";

export type FinanceBudgetGuard = {
  status: FinanceBudgetGuardStatus;
  pressureRatio: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  monthlyObligationsEstimate: number;
  remainingLiquidity: number;
};

export type FinanceObligationDueLabel =
  | "dueSoon"
  | "dueThisMonth"
  | "noDueDate";

export type FinanceUpcomingObligationPressure = {
  obligation: FinanceObligation;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  label: FinanceObligationDueLabel;
  remainingAmount: number;
  paidPercentage: number | null;
};

export type FinanceObligationProgress = {
  obligation: FinanceObligation;
  remainingAmount: number;
  paidPercentage: number | null;
};

export type FinanceReview = {
  summary: FinanceSummary;
  expenseCategoryBreakdown: FinanceExpenseCategoryBreakdown[];
  budgetGuard: FinanceBudgetGuard;
  upcomingObligations: FinanceUpcomingObligationPressure[];
  obligationProgress: FinanceObligationProgress[];
};

function parseDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function toSafeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function isInReferenceMonth(value: string, referenceDate: Date): boolean {
  const parsed = parseDate(value);
  return parsed ? isSameMonth(parsed, referenceDate) : false;
}

function getObligationRemainingAmount(obligation: FinanceObligation): number {
  return Math.max(
    toSafeAmount(obligation.totalAmount) - toSafeAmount(obligation.paidAmount),
    0
  );
}

function getObligationPaidPercentage(
  obligation: FinanceObligation
): number | null {
  if (obligation.totalAmount <= 0) {
    return null;
  }

  return Math.min(
    100,
    Math.max((toSafeAmount(obligation.paidAmount) / obligation.totalAmount) * 100, 0)
  );
}

function getNextDueDate(
  obligation: FinanceObligation,
  referenceDate: Date
): Date | null {
  const parsedDueDate = obligation.dueDate ? parseDate(obligation.dueDate) : null;
  if (parsedDueDate) {
    return parsedDueDate;
  }

  if (typeof obligation.dueDay !== "number") {
    return null;
  }

  const monthStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1
  );
  const currentMonthDueDay = Math.min(
    obligation.dueDay,
    new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
  );
  const currentMonthDueDate = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    currentMonthDueDay
  );

  if (differenceInCalendarDays(currentMonthDueDate, referenceDate) >= 0) {
    return currentMonthDueDate;
  }

  const nextMonth = addMonths(monthStart, 1);
  const nextMonthDueDay = Math.min(
    obligation.dueDay,
    new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
  );
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDueDay);
}

function compareDueDates(left: Date | null, right: Date | null): number {
  if (left && right) {
    return left.getTime() - right.getTime();
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
}

function getStatusOrder(status: FinanceObligation["status"]): number {
  switch (status) {
    case "active":
      return 0;
    case "paused":
      return 1;
    case "paid":
    default:
      return 2;
  }
}

function getMonthStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function getMonthLabelLocale(locale: FinanceMonthLabelLocale): string {
  return locale === "fa-IR" ? "fa-IR" : "en-US";
}

function getMonthCalendarName(calendar: FinanceMonthLabelCalendar): string {
  return calendar === "persian" ? "persian" : "gregory";
}

function getMonthKey(monthStart: Date): string {
  return format(monthStart, "yyyy-MM");
}

function getMonthSeriesStart(referenceDate: Date, monthCount: number): Date {
  return addMonths(getMonthStart(referenceDate), 1 - monthCount);
}

export function getCurrentMonthTransactions(
  transactions: FinanceTransaction[],
  referenceDate = new Date()
): FinanceTransaction[] {
  return transactions.filter((transaction) =>
    isInReferenceMonth(transaction.occurredAt, referenceDate)
  );
}

export function groupExpensesByCategory(
  transactions: FinanceTransaction[]
): Record<string, { amount: number; transactionCount: number }> {
  return transactions.reduce<Record<string, { amount: number; transactionCount: number }>>(
    (groups, transaction) => {
      const category = transaction.category.trim();
      const currentGroup = groups[category] ?? { amount: 0, transactionCount: 0 };
      groups[category] = {
        amount: currentGroup.amount + toSafeAmount(transaction.amount),
        transactionCount: currentGroup.transactionCount + 1,
      };
      return groups;
    },
    {}
  );
}

export function calculateExpenseCategoryBreakdown(
  transactions: FinanceTransaction[],
  referenceDate = new Date()
): FinanceExpenseCategoryBreakdown[] {
  const currentMonthExpenses = getCurrentMonthTransactions(
    transactions,
    referenceDate
  ).filter((transaction) => transaction.type === "expense");
  const groupedExpenses = groupExpensesByCategory(currentMonthExpenses);
  const totalExpenses = currentMonthExpenses.reduce(
    (total, transaction) => total + toSafeAmount(transaction.amount),
    0
  );

  return Object.entries(groupedExpenses)
    .map(([category, group]) => ({
      category,
      amount: group.amount,
      transactionCount: group.transactionCount,
      percentageOfExpenses:
        totalExpenses > 0 ? (group.amount / totalExpenses) * 100 : 0,
    }))
    .sort((left, right) => right.amount - left.amount || left.category.localeCompare(right.category));
}

export function calculateExpenseCategoryChartData(
  transactions: FinanceTransaction[],
  referenceDate = new Date()
): FinanceExpenseCategoryChartData[] {
  return calculateExpenseCategoryBreakdown(transactions, referenceDate);
}

export function calculateRemainingObligationTotal(
  obligations: FinanceObligation[]
): number {
  return obligations.reduce(
    (total, obligation) =>
      total + getObligationRemainingAmount(obligation),
    0
  );
}

export function calculateMonthlyObligationEstimate(
  obligations: FinanceObligation[],
  referenceDate = new Date()
): number {
  return obligations.reduce((total, obligation) => {
    if (obligation.status !== "active") {
      return total;
    }

    if (typeof obligation.monthlyAmount === "number") {
      return total + toSafeAmount(obligation.monthlyAmount);
    }

    if (typeof obligation.dueAmount !== "number") {
      return total;
    }

    if (obligation.dueDate) {
      return isInReferenceMonth(obligation.dueDate, referenceDate)
        ? total + toSafeAmount(obligation.dueAmount)
        : total;
    }

    return total + toSafeAmount(obligation.dueAmount);
  }, 0);
}

export function calculateMonthlyCashflowSeries(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date(),
  monthCount = 6
): FinanceCashflowSeriesPoint[] {
  const safeMonthCount = Number.isFinite(monthCount)
    ? Math.max(1, Math.floor(monthCount))
    : 6;
  const firstMonthStart = getMonthSeriesStart(referenceDate, safeMonthCount);

  return Array.from({ length: safeMonthCount }, (_, index) => {
    const monthStart = addMonths(firstMonthStart, index);
    const currentMonthTransactions = getCurrentMonthTransactions(
      transactions,
      monthStart
    );
    const income = currentMonthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + toSafeAmount(transaction.amount), 0);
    const expenses = currentMonthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + toSafeAmount(transaction.amount), 0);
    const obligationsEstimate = calculateMonthlyObligationEstimate(
      obligations,
      monthStart
    );

    return {
      monthKey: getMonthKey(monthStart),
      monthStart: format(monthStart, "yyyy-MM-dd"),
      income,
      expenses,
      obligations: obligationsEstimate,
      remainingLiquidity: income - expenses - obligationsEstimate,
    };
  });
}

export function calculateLastMonthsFinanceSeries(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceCashflowSeriesPoint[] {
  return calculateMonthlyCashflowSeries(transactions, obligations, referenceDate, 6);
}

export function calculateFinanceSummary(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceSummary {
  const currentMonthTransactions = getCurrentMonthTransactions(
    transactions,
    referenceDate
  );

  const incomeThisMonth = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + toSafeAmount(transaction.amount), 0);
  const expensesThisMonth = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + toSafeAmount(transaction.amount), 0);
  const monthlyObligationsEstimate = calculateMonthlyObligationEstimate(
    obligations,
    referenceDate
  );
  const totalRemainingObligation = calculateRemainingObligationTotal(
    obligations
  );

  return {
    incomeThisMonth,
    expensesThisMonth,
    monthlyObligationsEstimate,
    remainingLiquidity:
      incomeThisMonth - expensesThisMonth - monthlyObligationsEstimate,
    totalRemainingObligation,
  };
}

export function calculateBudgetGuard(
  summary: FinanceSummary
): FinanceBudgetGuard {
  const pressureTotal =
    Math.max(summary.expensesThisMonth, 0) +
    Math.max(summary.monthlyObligationsEstimate, 0);
  const pressureRatio =
    summary.incomeThisMonth > 0 ? pressureTotal / summary.incomeThisMonth : 0;

  if (summary.remainingLiquidity < 0) {
    return {
      status: "pressure",
      pressureRatio,
      incomeThisMonth: summary.incomeThisMonth,
      expensesThisMonth: summary.expensesThisMonth,
      monthlyObligationsEstimate: summary.monthlyObligationsEstimate,
      remainingLiquidity: summary.remainingLiquidity,
    };
  }

  if (summary.incomeThisMonth === 0 && pressureTotal > 0) {
    return {
      status: "watch",
      pressureRatio,
      incomeThisMonth: summary.incomeThisMonth,
      expensesThisMonth: summary.expensesThisMonth,
      monthlyObligationsEstimate: summary.monthlyObligationsEstimate,
      remainingLiquidity: summary.remainingLiquidity,
    };
  }

  if (summary.incomeThisMonth > 0 && pressureRatio > 0.8) {
    return {
      status: "watch",
      pressureRatio,
      incomeThisMonth: summary.incomeThisMonth,
      expensesThisMonth: summary.expensesThisMonth,
      monthlyObligationsEstimate: summary.monthlyObligationsEstimate,
      remainingLiquidity: summary.remainingLiquidity,
    };
  }

  return {
    status: "calm",
    pressureRatio,
    incomeThisMonth: summary.incomeThisMonth,
    expensesThisMonth: summary.expensesThisMonth,
    monthlyObligationsEstimate: summary.monthlyObligationsEstimate,
    remainingLiquidity: summary.remainingLiquidity,
  };
}

export function getRecentFinanceTransactions(
  transactions: FinanceTransaction[],
  limit = 5
): FinanceTransaction[] {
  return [...transactions]
    .sort(
      (left, right) =>
        right.occurredAt.localeCompare(left.occurredAt) ||
        right.updatedAt.localeCompare(left.updatedAt)
    )
    .slice(0, limit);
}

export function getActiveFinanceObligations(
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceObligation[] {
  return obligations
    .filter((obligation) => obligation.status === "active")
    .sort(
      (left, right) =>
        compareDueDates(
          getNextDueDate(left, referenceDate),
          getNextDueDate(right, referenceDate)
        ) || right.updatedAt.localeCompare(left.updatedAt)
    );
}

export function getUpcomingObligations(
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceUpcomingObligationPressure[] {
  return obligations
    .filter((obligation) => obligation.status === "active")
    .map((obligation) => {
      const nextDueDate = getNextDueDate(obligation, referenceDate);
      const daysUntilDue = nextDueDate
        ? differenceInCalendarDays(nextDueDate, referenceDate)
        : null;
      const label: FinanceObligationDueLabel =
        nextDueDate === null
          ? "noDueDate"
          : daysUntilDue !== null && daysUntilDue <= 7
            ? "dueSoon"
            : "dueThisMonth";

      return {
        obligation,
        nextDueDate: nextDueDate ? format(nextDueDate, "yyyy-MM-dd") : null,
        daysUntilDue,
        label,
        remainingAmount: getObligationRemainingAmount(obligation),
        paidPercentage: getObligationPaidPercentage(obligation),
      };
    })
    .sort((left, right) =>
      compareDueDates(
        left.nextDueDate ? parseDate(left.nextDueDate) : null,
        right.nextDueDate ? parseDate(right.nextDueDate) : null
      ) || right.obligation.updatedAt.localeCompare(left.obligation.updatedAt)
    );
}

export function calculateObligationProgress(
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceObligationProgress[] {
  return [...obligations]
    .map((obligation) => ({
      obligation,
      remainingAmount: getObligationRemainingAmount(obligation),
      paidPercentage: getObligationPaidPercentage(obligation),
    }))
    .sort((left, right) => {
      const statusOrderDelta =
        getStatusOrder(left.obligation.status) - getStatusOrder(right.obligation.status);

      if (statusOrderDelta !== 0) {
        return statusOrderDelta;
      }

      const dueDateDelta = compareDueDates(
        getNextDueDate(left.obligation, referenceDate),
        getNextDueDate(right.obligation, referenceDate)
      );

      if (dueDateDelta !== 0) {
        return dueDateDelta;
      }

      return right.obligation.updatedAt.localeCompare(left.obligation.updatedAt);
    });
}

export function calculateObligationProgressChartData(
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceObligationProgress[] {
  return calculateObligationProgress(
    obligations.filter((obligation) => obligation.status !== "paid"),
    referenceDate
  );
}

export function calculateFinanceReview(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceReview {
  const summary = calculateFinanceSummary(transactions, obligations, referenceDate);

  return {
    summary,
    expenseCategoryBreakdown: calculateExpenseCategoryBreakdown(
      transactions,
      referenceDate
    ),
    budgetGuard: calculateBudgetGuard(summary),
    upcomingObligations: getUpcomingObligations(obligations, referenceDate),
    obligationProgress: calculateObligationProgress(obligations, referenceDate),
  };
}

export function formatFinanceAmount(
  amount: number,
  locale: "fa-IR" | "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFinanceMonthLabel(
  value: string | Date,
  locale: FinanceMonthLabelLocale,
  calendar: FinanceMonthLabelCalendar
): string {
  const parsed = parseDate(typeof value === "string" ? value : format(value, "yyyy-MM-dd"));
  if (!parsed) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.DateTimeFormat(`${getMonthLabelLocale(locale)}-u-ca-${getMonthCalendarName(calendar)}`, {
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export type { FinanceSummary };
