import { describe, expect, it } from "vitest";

import type { FinanceObligation, FinanceTransaction } from "@/shared/types";
import {
  calculateBudgetGuard,
  calculateExpenseCategoryBreakdown,
  calculateFinanceReview,
  calculateFinanceSummary,
  calculateObligationProgress,
  calculateMonthlyObligationEstimate,
  calculateRemainingObligationTotal,
  formatFinanceAmount,
  getActiveFinanceObligations,
  getCurrentMonthTransactions,
  getRecentFinanceTransactions,
  getUpcomingObligations,
  groupExpensesByCategory,
} from "../financeCalculations";

const transactions: FinanceTransaction[] = [
  {
    id: "income-1",
    type: "income",
    title: "Salary",
    amount: 5000,
    category: "salary",
    occurredAt: "2026-07-05",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "expense-1",
    type: "expense",
    title: "Groceries",
    amount: 1200,
    category: "groceries",
    occurredAt: "2026-07-06",
    createdAt: "2026-07-06T08:30:00.000Z",
    updatedAt: "2026-07-06T08:30:00.000Z",
  },
  {
    id: "income-2",
    type: "income",
    title: "Old bonus",
    amount: 800,
    category: "bonus",
    occurredAt: "2026-06-20",
    createdAt: "2026-06-20T08:30:00.000Z",
    updatedAt: "2026-06-20T08:30:00.000Z",
  },
];

const obligations: FinanceObligation[] = [
  {
    id: "installment-1",
    type: "installment",
    title: "Phone installment",
    totalAmount: 2400,
    paidAmount: 600,
    monthlyAmount: 400,
    dueDay: 12,
    status: "active",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "debt-1",
    type: "debt",
    title: "Family debt",
    totalAmount: 3000,
    paidAmount: 500,
    dueAmount: 700,
    dueDate: "2026-07-10",
    status: "active",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "debt-2",
    type: "debt",
    title: "Paused debt",
    totalAmount: 1000,
    paidAmount: 250,
    dueAmount: 250,
    status: "paused",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "debt-3",
    type: "debt",
    title: "Paid debt",
    totalAmount: 500,
    paidAmount: 500,
    dueAmount: 100,
    dueDate: "2026-07-08",
    status: "paid",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
];

describe("finance calculations", () => {
  it("calculates the current month finance summary", () => {
    expect(
      calculateFinanceSummary(transactions, obligations, new Date("2026-07-09T12:00:00.000Z"))
    ).toEqual({
      incomeThisMonth: 5000,
      expensesThisMonth: 1200,
      monthlyObligationsEstimate: 1100,
      remainingLiquidity: 2700,
      totalRemainingObligation: 5050,
    });
  });

  it("groups expense categories and builds a sorted monthly breakdown", () => {
    const grouped = groupExpensesByCategory([
      {
        id: "expense-2",
        type: "expense",
        title: "Transport",
        amount: 500,
        category: "transport",
        occurredAt: "2026-07-07",
        createdAt: "2026-07-07T08:30:00.000Z",
        updatedAt: "2026-07-07T08:30:00.000Z",
      },
      {
        id: "expense-3",
        type: "expense",
        title: "Groceries",
        amount: 300,
        category: "groceries",
        occurredAt: "2026-07-08",
        createdAt: "2026-07-08T08:30:00.000Z",
        updatedAt: "2026-07-08T08:30:00.000Z",
      },
      {
        id: "expense-4",
        type: "expense",
        title: "Groceries again",
        amount: 200,
        category: "groceries",
        occurredAt: "2026-07-08",
        createdAt: "2026-07-08T09:30:00.000Z",
        updatedAt: "2026-07-08T09:30:00.000Z",
      },
    ]);

    expect(grouped).toEqual({
      groceries: { amount: 500, transactionCount: 2 },
      transport: { amount: 500, transactionCount: 1 },
    });

    expect(
      calculateExpenseCategoryBreakdown(transactions, new Date("2026-07-09T12:00:00.000Z"))
    ).toEqual([
      {
        category: "groceries",
        amount: 1200,
        transactionCount: 1,
        percentageOfExpenses: 100,
      },
    ]);
  });

  it("keeps paused obligations out of the monthly estimate but in the remaining total", () => {
    expect(
      calculateMonthlyObligationEstimate(obligations, new Date("2026-07-09T12:00:00.000Z"))
    ).toBe(1100);
    expect(calculateRemainingObligationTotal(obligations)).toBe(5050);
  });

  it("orders active obligations by the closest due date and skips paid items", () => {
    expect(
      getActiveFinanceObligations(obligations, new Date("2026-07-09T12:00:00.000Z")).map(
        (item) => item.id
      )
    ).toEqual(["debt-1", "installment-1"]);

    expect(
      getUpcomingObligations(obligations, new Date("2026-07-09T12:00:00.000Z")).map(
        (item) => item.obligation.id
      )
    ).toEqual(["debt-1", "installment-1"]);
    expect(
      getUpcomingObligations(obligations, new Date("2026-07-09T12:00:00.000Z")).some(
        (item) => item.obligation.id === "debt-3"
      )
    ).toBe(false);
  });

  it("calculates budget guard statuses from the summary data", () => {
    expect(
      calculateBudgetGuard({
        incomeThisMonth: 0,
        expensesThisMonth: 100,
        monthlyObligationsEstimate: 25,
        remainingLiquidity: -125,
        totalRemainingObligation: 0,
      }).status
    ).toBe("pressure");

    expect(
      calculateBudgetGuard({
        incomeThisMonth: 0,
        expensesThisMonth: 100,
        monthlyObligationsEstimate: 25,
        remainingLiquidity: 0,
        totalRemainingObligation: 0,
      }).status
    ).toBe("watch");

    expect(
      calculateBudgetGuard({
        incomeThisMonth: 1000,
        expensesThisMonth: 200,
        monthlyObligationsEstimate: 150,
        remainingLiquidity: 650,
        totalRemainingObligation: 0,
      }).status
    ).toBe("calm");
  });

  it("calculates obligation progress safely for zero totals", () => {
    expect(
      calculateObligationProgress(
        [
          {
            id: "zero-total",
            type: "debt",
            title: "Zero total",
            totalAmount: 0,
            paidAmount: 0,
            status: "active",
            createdAt: "2026-07-09T08:30:00.000Z",
            updatedAt: "2026-07-09T08:30:00.000Z",
          },
        ],
        new Date("2026-07-09T12:00:00.000Z")
      )
    ).toEqual([
      {
        obligation: {
          id: "zero-total",
          type: "debt",
          title: "Zero total",
          totalAmount: 0,
          paidAmount: 0,
          status: "active",
          createdAt: "2026-07-09T08:30:00.000Z",
          updatedAt: "2026-07-09T08:30:00.000Z",
        },
        remainingAmount: 0,
        paidPercentage: null,
      },
    ]);
  });

  it("returns the most recent transactions and active obligations", () => {
    expect(getCurrentMonthTransactions(transactions, new Date("2026-07-09T12:00:00.000Z"))).toHaveLength(2);
    expect(getRecentFinanceTransactions(transactions, 2).map((item) => item.id)).toEqual([
      "expense-1",
      "income-1",
    ]);
    expect(
      getActiveFinanceObligations(obligations, new Date("2026-07-09T12:00:00.000Z")).map(
        (item) => item.id
      )
    ).toEqual(["debt-1", "installment-1"]);
  });

  it("formats finance amounts with the selected locale", () => {
    expect(formatFinanceAmount(12345, "en-US")).toBe("12,345");
    expect(formatFinanceAmount(12345, "fa-IR")).toBeTruthy();
  });

  it("builds a combined finance review from the current data", () => {
    const review = calculateFinanceReview(
      transactions,
      obligations,
      new Date("2026-07-09T12:00:00.000Z")
    );

    expect(review.summary.remainingLiquidity).toBe(2700);
    expect(review.expenseCategoryBreakdown[0]?.category).toBe("groceries");
    expect(review.budgetGuard.status).toBe("calm");
    expect(review.upcomingObligations[0]?.obligation.id).toBe("debt-1");
  });
});
