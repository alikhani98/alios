import { describe, expect, it } from "vitest";

import { calculateFinanceSummary } from "@/features/finance/financeCalculations";
import { financeObligationRecord, financeTransactionRecord } from "@/test/factories";
import { buildHomeFinanceOverview } from "../homeFinanceOverview";

describe("Home Finance projection", () => {
  it("uses the Finance Gregorian month semantics, including future dates and negative net", () => {
    const date = new Date(2026, 9, 19, 12);
    const transactions = [
      { ...financeTransactionRecord, id: "first", type: "income" as const, occurredAt: "2026-10-01", amount: 12345 },
      { ...financeTransactionRecord, id: "future", type: "expense" as const, occurredAt: "2026-10-31", amount: 98765 },
      { ...financeTransactionRecord, id: "before", occurredAt: "2026-09-30", amount: 999999 },
      { ...financeTransactionRecord, id: "after", occurredAt: "2026-11-01", amount: 999999 },
    ];
    const obligations = [
      { ...financeObligationRecord, id: "active-zero", status: "active" as const, totalAmount: 0, paidAmount: 0 },
      { ...financeObligationRecord, id: "paid", status: "paid" as const },
      { ...financeObligationRecord, id: "paused", status: "paused" as const },
    ];
    const source = structuredClone({ transactions, obligations });
    const summary = calculateFinanceSummary(transactions, obligations, date);
    const snapshot = buildHomeFinanceOverview(transactions, obligations, date);
    expect(snapshot.incomeThisMonth).toBe(summary.incomeThisMonth);
    expect(snapshot.expensesThisMonth).toBe(summary.expensesThisMonth);
    expect(snapshot.incomeThisMonth).toBe(12345);
    expect(snapshot.expensesThisMonth).toBe(98765);
    expect(snapshot.transactionNet).toBe(-86420);
    expect(snapshot.monthlyTransactionCount).toBe(2);
    expect(snapshot.activeObligationCount).toBe(1);
    expect(snapshot.monthStart).toBe("2026-10-01");
    expect(snapshot.monthEnd).toBe("2026-10-31");
    expect({ transactions, obligations }).toEqual(source);
  });

  it("distinguishes empty records, history without this month's activity, and recorded zero", () => {
    const date = new Date(2024, 1, 15);
    const empty = buildHomeFinanceOverview([], [], date);
    const history = buildHomeFinanceOverview([{ ...financeTransactionRecord, occurredAt: "2024-01-31" }], [], date);
    const zero = buildHomeFinanceOverview([{ ...financeTransactionRecord, occurredAt: "2024-02-29", amount: 0 }], [], date);
    expect(empty.transactionCount).toBe(0);
    expect(history.transactionCount).toBe(1);
    expect(history.monthlyTransactionCount).toBe(0);
    expect(zero.monthlyTransactionCount).toBe(1);
    expect(zero.transactionNet).toBe(0);
    expect(zero.monthEnd).toBe("2024-02-29");
  });
});
