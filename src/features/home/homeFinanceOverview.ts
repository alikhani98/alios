import { endOfMonth, format, startOfMonth } from "date-fns";

import { calculateFinanceSummary, getCurrentMonthTransactions } from "@/features/finance/financeCalculations";
import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

export function buildHomeFinanceOverview(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[],
  referenceDate = new Date()
) {
  const summary = calculateFinanceSummary(transactions, obligations, referenceDate);
  return {
    transactionCount: transactions.length,
    obligationCount: obligations.length,
    monthlyTransactionCount: getCurrentMonthTransactions(transactions, referenceDate).length,
    activeObligationCount: obligations.filter((entry) => entry.status === "active").length,
    incomeThisMonth: summary.incomeThisMonth,
    expensesThisMonth: summary.expensesThisMonth,
    transactionNet: summary.incomeThisMonth - summary.expensesThisMonth,
    remainingLiquidity: summary.remainingLiquidity,
    remainingObligationTotal: summary.totalRemainingObligation,
    monthStart: format(startOfMonth(referenceDate), "yyyy-MM-dd"),
    monthEnd: format(endOfMonth(referenceDate), "yyyy-MM-dd"),
  };
}

export type HomeFinanceOverviewSnapshot = ReturnType<typeof buildHomeFinanceOverview>;
export type HomeFinanceOverviewState = {
  data: HomeFinanceOverviewSnapshot | null;
  isLoading: boolean;
  hasError: boolean;
};
