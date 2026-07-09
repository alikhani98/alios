import { describe, expect, it } from "vitest";

import type { FinanceObligation, FinanceTransaction } from "@/shared/types";
import {
  calculateFinanceSummary,
  calculateMonthlyObligationEstimate,
  calculateRemainingObligationTotal,
  formatFinanceAmount,
  getActiveFinanceObligations,
  getRecentFinanceTransactions,
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

  it("keeps paused obligations out of the monthly estimate but in the remaining total", () => {
    expect(
      calculateMonthlyObligationEstimate(obligations, new Date("2026-07-09T12:00:00.000Z"))
    ).toBe(1100);
    expect(calculateRemainingObligationTotal(obligations)).toBe(5050);
  });

  it("returns the most recent transactions and active obligations", () => {
    expect(getRecentFinanceTransactions(transactions, 2).map((item) => item.id)).toEqual([
      "expense-1",
      "income-1",
    ]);
    expect(getActiveFinanceObligations(obligations).map((item) => item.id)).toEqual([
      "installment-1",
      "debt-1",
    ]);
  });

  it("formats finance amounts with the selected locale", () => {
    expect(formatFinanceAmount(12345, "en-US")).toBe("12,345");
    expect(formatFinanceAmount(12345, "fa-IR")).toBeTruthy();
  });
});
