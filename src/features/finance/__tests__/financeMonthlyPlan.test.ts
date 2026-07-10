import { describe, expect, it } from "vitest";

import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

import { calculateFinanceMonthlyPlan } from "../financeMonthlyPlan";

const referenceDate = new Date(2026, 6, 18, 12, 0, 0);

const baseTransactions: FinanceTransaction[] = [
  {
    id: "income-current",
    type: "income",
    title: "Salary",
    amount: 4000,
    category: "salary",
    occurredAt: "2026-07-05",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "expense-current",
    type: "expense",
    title: "Groceries",
    amount: 1200,
    category: "groceries",
    occurredAt: "2026-07-10",
    createdAt: "2026-07-10T08:30:00.000Z",
    updatedAt: "2026-07-10T08:30:00.000Z",
  },
  {
    id: "income-previous-month",
    type: "income",
    title: "Old bonus",
    amount: 900,
    category: "bonus",
    occurredAt: "2026-06-20",
    createdAt: "2026-06-20T08:30:00.000Z",
    updatedAt: "2026-06-20T08:30:00.000Z",
  },
  {
    id: "invalid-date",
    type: "expense",
    title: "Invalid date",
    amount: 700,
    category: "other",
    occurredAt: "not-a-date",
    createdAt: "2026-07-12T08:30:00.000Z",
    updatedAt: "2026-07-12T08:30:00.000Z",
  },
];

const baseObligations: FinanceObligation[] = [
  {
    id: "installment-current",
    type: "installment",
    title: "Phone installment",
    totalAmount: 1000,
    paidAmount: 100,
    monthlyAmount: 250,
    dueDay: 20,
    status: "active",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "debt-current",
    type: "debt",
    title: "Family debt",
    totalAmount: 900,
    paidAmount: 300,
    dueAmount: 200,
    dueDate: "2026-07-22",
    status: "active",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "paused-obligation",
    type: "debt",
    title: "Paused debt",
    totalAmount: 700,
    paidAmount: 200,
    dueAmount: 150,
    status: "paused",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "paid-obligation",
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

describe("finance monthly plan", () => {
  it("returns a calm low-data plan when there is nothing useful yet", () => {
    expect(calculateFinanceMonthlyPlan([], [], referenceDate)).toEqual({
      monthStart: "2026-07-01",
      monthEnd: "2026-07-31",
      daysInMonth: 31,
      daysElapsed: 18,
      daysRemaining: 13,
      incomeThisMonth: 0,
      expenseThisMonth: 0,
      netThisMonth: 0,
      activeObligationCount: 0,
      activeObligationRemaining: 0,
      paidObligationAmount: 0,
      monthlyObligationsEstimate: 0,
      estimatedRemaining: 0,
      dailyRemainingEstimate: 0,
      pressureLevel: "calm",
      focusKey: "finance.monthlyPlanFocusCalm",
      hasUsefulData: false,
    });
  });

  it("counts current-month income, spending, and active obligations only", () => {
    expect(
      calculateFinanceMonthlyPlan(baseTransactions, baseObligations, referenceDate)
    ).toEqual({
      monthStart: "2026-07-01",
      monthEnd: "2026-07-31",
      daysInMonth: 31,
      daysElapsed: 18,
      daysRemaining: 13,
      incomeThisMonth: 4000,
      expenseThisMonth: 1200,
      netThisMonth: 2800,
      activeObligationCount: 2,
      activeObligationRemaining: 1500,
      paidObligationAmount: 400,
      monthlyObligationsEstimate: 450,
      estimatedRemaining: 2350,
      dailyRemainingEstimate: 180.76923076923077,
      pressureLevel: "calm",
      focusKey: "finance.monthlyPlanFocusCalm",
      hasUsefulData: true,
    });
  });

  it("ignores transactions outside the current month and invalid dates", () => {
    const plan = calculateFinanceMonthlyPlan(
      [
        {
          id: "income-current-only",
          type: "income",
          title: "Salary",
          amount: 1200,
          category: "salary",
          occurredAt: "2026-07-06",
          createdAt: "2026-07-06T08:30:00.000Z",
          updatedAt: "2026-07-06T08:30:00.000Z",
        },
        {
          id: "expense-previous-month",
          type: "expense",
          title: "Old expense",
          amount: 500,
          category: "other",
          occurredAt: "2026-06-29",
          createdAt: "2026-06-29T08:30:00.000Z",
          updatedAt: "2026-06-29T08:30:00.000Z",
        },
        {
          id: "expense-invalid",
          type: "expense",
          title: "Broken date",
          amount: 200,
          category: "other",
          occurredAt: "broken-date",
          createdAt: "2026-07-12T08:30:00.000Z",
          updatedAt: "2026-07-12T08:30:00.000Z",
        },
      ],
      [],
      referenceDate
    );

    expect(plan.incomeThisMonth).toBe(1200);
    expect(plan.expenseThisMonth).toBe(0);
    expect(plan.estimatedRemaining).toBe(1200);
  });

  it("switches pressure levels based on the remaining estimate and obligation pressure", () => {
    expect(
      calculateFinanceMonthlyPlan(
        [
          {
            id: "calm-income",
            type: "income",
            title: "Salary",
            amount: 4000,
            category: "salary",
            occurredAt: "2026-07-05",
            createdAt: "2026-07-05T08:30:00.000Z",
            updatedAt: "2026-07-05T08:30:00.000Z",
          },
          {
            id: "calm-expense",
            type: "expense",
            title: "Groceries",
            amount: 1000,
            category: "groceries",
            occurredAt: "2026-07-10",
            createdAt: "2026-07-10T08:30:00.000Z",
            updatedAt: "2026-07-10T08:30:00.000Z",
          },
        ],
        [
          {
            id: "calm-obligation",
            type: "installment",
            title: "Small installment",
            totalAmount: 800,
            paidAmount: 200,
            monthlyAmount: 200,
            dueDay: 20,
            status: "active",
            createdAt: "2026-07-05T08:30:00.000Z",
            updatedAt: "2026-07-05T08:30:00.000Z",
          },
        ],
        referenceDate
      ).pressureLevel
    ).toBe("calm");

    expect(
      calculateFinanceMonthlyPlan(
        [
          {
            id: "watch-income",
            type: "income",
            title: "Salary",
            amount: 1000,
            category: "salary",
            occurredAt: "2026-07-05",
            createdAt: "2026-07-05T08:30:00.000Z",
            updatedAt: "2026-07-05T08:30:00.000Z",
          },
          {
            id: "watch-expense",
            type: "expense",
            title: "Groceries",
            amount: 700,
            category: "groceries",
            occurredAt: "2026-07-10",
            createdAt: "2026-07-10T08:30:00.000Z",
            updatedAt: "2026-07-10T08:30:00.000Z",
          },
        ],
        [
          {
            id: "watch-obligation",
            type: "debt",
            title: "Debt",
            totalAmount: 600,
            paidAmount: 100,
            dueAmount: 100,
            dueDate: "2026-07-22",
            status: "active",
            createdAt: "2026-07-05T08:30:00.000Z",
            updatedAt: "2026-07-05T08:30:00.000Z",
          },
        ],
        referenceDate
      ).pressureLevel
    ).toBe("watch");

    expect(
      calculateFinanceMonthlyPlan(
        [
          {
            id: "pressure-income",
            type: "income",
            title: "Salary",
            amount: 1000,
            category: "salary",
            occurredAt: "2026-07-05",
            createdAt: "2026-07-05T08:30:00.000Z",
            updatedAt: "2026-07-05T08:30:00.000Z",
          },
          {
            id: "pressure-expense",
            type: "expense",
            title: "Rent",
            amount: 900,
            category: "rent",
            occurredAt: "2026-07-10",
            createdAt: "2026-07-10T08:30:00.000Z",
            updatedAt: "2026-07-10T08:30:00.000Z",
          },
        ],
        [
          {
            id: "pressure-obligation",
            type: "debt",
            title: "Debt",
            totalAmount: 1000,
            paidAmount: 100,
            dueAmount: 200,
            dueDate: "2026-07-22",
            status: "active",
            createdAt: "2026-07-05T08:30:00.000Z",
            updatedAt: "2026-07-05T08:30:00.000Z",
          },
        ],
        referenceDate
      ).pressureLevel
    ).toBe("pressure");
  });
});
