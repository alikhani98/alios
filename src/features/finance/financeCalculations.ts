import { isSameMonth, isValid, parseISO } from "date-fns";

import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

type FinanceSummary = {
  incomeThisMonth: number;
  expensesThisMonth: number;
  monthlyObligationsEstimate: number;
  remainingLiquidity: number;
  totalRemainingObligation: number;
};

function parseDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function isInReferenceMonth(value: string, referenceDate: Date): boolean {
  const parsed = parseDate(value);
  return parsed ? isSameMonth(parsed, referenceDate) : false;
}

export function calculateRemainingObligationTotal(
  obligations: FinanceObligation[]
): number {
  return obligations.reduce(
    (total, obligation) =>
      total + Math.max(obligation.totalAmount - obligation.paidAmount, 0),
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
      return total + obligation.monthlyAmount;
    }

    if (typeof obligation.dueAmount !== "number") {
      return total;
    }

    if (obligation.dueDate) {
      return isInReferenceMonth(obligation.dueDate, referenceDate)
        ? total + obligation.dueAmount
        : total;
    }

    return total + obligation.dueAmount;
  }, 0);
}

export function calculateFinanceSummary(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date()
): FinanceSummary {
  const currentMonthTransactions = transactions.filter((transaction) =>
    isInReferenceMonth(transaction.occurredAt, referenceDate)
  );

  const incomeThisMonth = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expensesThisMonth = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
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
  obligations: FinanceObligation[]
): FinanceObligation[] {
  return obligations
    .filter((obligation) => obligation.status === "active")
    .sort(
      (left, right) =>
        (left.dueDate ?? left.updatedAt).localeCompare(
          right.dueDate ?? right.updatedAt
        ) || right.updatedAt.localeCompare(left.updatedAt)
    );
}

export function formatFinanceAmount(
  amount: number,
  locale: "fa-IR" | "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount);
}

export type { FinanceSummary };
