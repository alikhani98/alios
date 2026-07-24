import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

const financeTransactions: FinanceTransaction[] = [
  {
    id: "expense-legacy-category",
    type: "expense",
    title: "Legacy expense",
    amount: 725,
    category: 0 as unknown as string,
    occurredAt: "2026-07-09",
    createdAt: "2026-07-09T08:30:00.000Z",
    updatedAt: "2026-07-09T08:30:00.000Z",
  },
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
];

const financeObligations: FinanceObligation[] = [
  {
    id: "debt-1",
    type: "debt",
    title: "بانک مهر شماره 1",
    totalAmount: 39114120,
    paidAmount: 0,
    monthlyAmount: 1476000,
    dueDay: 5,
    counterparty: "بانک مهر",
    status: "active",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-24T08:30:00.000Z",
  },
];

vi.mock("../hooks/useFinance", () => ({
  useFinance: () => ({
    transactions: financeTransactions,
    obligations: financeObligations,
    isLoading: false,
    error: null,
    loadFinance: async () => undefined,
    createTransaction: async () => undefined,
    updateTransaction: async () => undefined,
    deleteTransaction: async () => undefined,
    createObligation: async () => undefined,
    updateObligation: async () => undefined,
    deleteObligation: async () => undefined,
  }),
}));

import { FinancePage } from "../pages/FinancePage";

describe("FinancePage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");
  });

  it("renders the Finance route, active debt edit affordance, and Persian labels without crashing", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <DateDisplayProvider>
          <FinancePage />
        </DateDisplayProvider>
      </I18nProvider>
    );

    expect(markup).toContain("بانک مهر شماره 1");
    expect(markup).toContain("ویرایش");
    expect(markup).toContain("افزودن قسط / بدهی");
    expect(markup).not.toContain("AliOS could not prepare local data");
  });
});
