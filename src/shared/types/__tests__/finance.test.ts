import { describe, expect, it } from "vitest";

import {
  financeAssetSchema,
  financeCategoryBudgetSchema,
  financeObligationSchema,
  financeTransactionSchema,
} from "../finance";

describe("finance schemas", () => {
  it("accepts valid finance transactions and obligations", () => {
    expect(
      financeTransactionSchema.safeParse({
        id: "transaction-1",
        type: "income",
        title: "Salary",
        amount: 5000,
        category: "salary",
        occurredAt: "2026-07-05",
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(true);

    expect(
      financeObligationSchema.safeParse({
        id: "obligation-1",
        type: "debt",
        title: "Family debt",
        totalAmount: 3000,
        paidAmount: 500,
        dueAmount: 700,
        monthlyAmount: 250,
        dueDay: 12,
        dueDate: "2026-07-10",
        counterparty: "Family",
        status: "active",
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(true);

    expect(
      financeCategoryBudgetSchema.safeParse({
        id: "budget-1",
        category: "groceries",
        monthlyLimitAmount: 1200,
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(true);

    expect(
      financeAssetSchema.safeParse({
        id: "asset-1",
        title: "Emergency savings",
        type: "savings",
        currentValue: 10000,
        notes: "Manual balance",
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(true);
  });

  it("rejects invalid finance amounts and fields", () => {
    expect(
      financeTransactionSchema.safeParse({
        id: "transaction-1",
        type: "income",
        title: " ",
        amount: -1,
        category: "salary",
        occurredAt: "2026-07-05",
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(false);

    expect(
      financeObligationSchema.safeParse({
        id: "obligation-1",
        type: "debt",
        title: "Family debt",
        totalAmount: 3000,
        paidAmount: 500,
        dueDay: 32,
        status: "active",
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(false);

    expect(
      financeAssetSchema.safeParse({
        id: "asset-1",
        title: " ",
        type: "crypto",
        currentValue: -1,
        createdAt: "2026-07-05T08:30:00.000Z",
        updatedAt: "2026-07-05T08:30:00.000Z",
      }).success
    ).toBe(false);
  });
});
