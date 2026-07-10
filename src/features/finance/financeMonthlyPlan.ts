import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";

import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

import {
  calculateMonthlyObligationEstimate,
  calculateRemainingObligationTotal,
  getCurrentMonthTransactions,
  getActiveFinanceObligations,
} from "./financeCalculations";

export type FinanceMonthlyPlanPressureLevel = "calm" | "watch" | "pressure";

export type FinanceMonthlyPlanFocusKey =
  | "finance.monthlyPlanFocusCalm"
  | "finance.monthlyPlanFocusWatch"
  | "finance.monthlyPlanFocusPressure";

export type FinanceMonthlyPlan = {
  monthStart: string;
  monthEnd: string;
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  netThisMonth: number;
  activeObligationCount: number;
  activeObligationRemaining: number;
  paidObligationAmount: number;
  monthlyObligationsEstimate: number;
  estimatedRemaining: number;
  dailyRemainingEstimate: number;
  pressureLevel: FinanceMonthlyPlanPressureLevel;
  focusKey: FinanceMonthlyPlanFocusKey;
  hasUsefulData: boolean;
};

function toSafeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function getPressureLevel(
  estimatedRemaining: number,
  monthlyObligationsEstimate: number,
  incomeThisMonth: number,
  hasUsefulData: boolean
): FinanceMonthlyPlanPressureLevel {
  if (!hasUsefulData) {
    return "calm";
  }

  if (estimatedRemaining < 0) {
    return "pressure";
  }

  const incomeBase = Math.max(incomeThisMonth, 1);
  const obligationPressureRatio = monthlyObligationsEstimate / incomeBase;

  if (obligationPressureRatio >= 0.5) {
    return "pressure";
  }

  if (
    estimatedRemaining <= incomeThisMonth * 0.2 ||
    obligationPressureRatio >= 0.25
  ) {
    return "watch";
  }

  return "calm";
}

function getFocusKey(
  pressureLevel: FinanceMonthlyPlanPressureLevel
): FinanceMonthlyPlanFocusKey {
  switch (pressureLevel) {
    case "watch":
      return "finance.monthlyPlanFocusWatch";
    case "pressure":
      return "finance.monthlyPlanFocusPressure";
    case "calm":
    default:
      return "finance.monthlyPlanFocusCalm";
  }
}

export function calculateFinanceMonthlyPlan(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceMonthlyPlan {
  const currentMonthTransactions = getCurrentMonthTransactions(
    transactions,
    referenceDate
  );
  const currentMonthIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + toSafeAmount(transaction.amount), 0);
  const currentMonthExpenses = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + toSafeAmount(transaction.amount), 0);
  const currentMonthObligationPressure = calculateMonthlyObligationEstimate(
    obligations,
    referenceDate
  );
  const activeObligations = getActiveFinanceObligations(obligations, referenceDate);
  const activeObligationRemaining = calculateRemainingObligationTotal(
    activeObligations
  );
  const activeObligationPaidAmount = activeObligations.reduce(
    (total, obligation) =>
      total +
      Math.min(
        toSafeAmount(obligation.paidAmount),
        toSafeAmount(obligation.totalAmount)
      ),
    0
  );
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const daysInMonth = monthEnd.getDate();
  const daysElapsed = Math.min(
    Math.max(differenceInCalendarDays(referenceDate, monthStart) + 1, 1),
    daysInMonth
  );
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);
  const estimatedRemaining =
    currentMonthIncome - currentMonthExpenses - currentMonthObligationPressure;
  const hasUsefulData =
    currentMonthTransactions.length > 0 || activeObligations.length > 0;
  const pressureLevel = getPressureLevel(
    estimatedRemaining,
    currentMonthObligationPressure,
    currentMonthIncome,
    hasUsefulData
  );

  return {
    monthStart: format(monthStart, "yyyy-MM-dd"),
    monthEnd: format(monthEnd, "yyyy-MM-dd"),
    daysInMonth,
    daysElapsed,
    daysRemaining,
    incomeThisMonth: currentMonthIncome,
    expenseThisMonth: currentMonthExpenses,
    netThisMonth: currentMonthIncome - currentMonthExpenses,
    activeObligationCount: activeObligations.length,
    activeObligationRemaining,
    paidObligationAmount: activeObligationPaidAmount,
    monthlyObligationsEstimate: currentMonthObligationPressure,
    estimatedRemaining,
    dailyRemainingEstimate: estimatedRemaining / Math.max(daysRemaining, 1),
    pressureLevel,
    focusKey: getFocusKey(pressureLevel),
    hasUsefulData,
  };
}
