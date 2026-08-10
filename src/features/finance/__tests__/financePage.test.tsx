import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountRuntimeProvider } from "@/core/account";
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

function countOccurrences(value: string, needle: string) {
  return value.split(needle).length - 1;
}

describe("FinancePage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");
  });

  it("renders finance search, sync awareness, and Persian finance labels without crashing", () => {
    const markup = renderToStaticMarkup(
      <AccountRuntimeProvider>
        <I18nProvider>
          <DateDisplayProvider>
            <FinancePage />
          </DateDisplayProvider>
        </I18nProvider>
      </AccountRuntimeProvider>
    );

    expect(markup).toContain("بانک مهر شماره 1");
    expect(markup).toContain("ویرایش");
    expect(markup).toContain("افزودن قسط / بدهی");
    expect(markup).toContain("جستجوی رکوردهای مالی");
    expect(markup).toContain("آگاهی از همگام‌سازی مالی");
    expect(markup).not.toContain("AliOS could not prepare local data");
  });

  it("keeps finance summary, add path, filters, and first obligation direct while collapsing dense details", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");

    const markup = renderToStaticMarkup(
      <AccountRuntimeProvider>
        <I18nProvider>
          <DateDisplayProvider>
            <FinancePage />
          </DateDisplayProvider>
        </I18nProvider>
      </AccountRuntimeProvider>
    );

    expect(markup).toContain("Add income / expense");
    expect(markup).toContain("Search finance records");
    expect(markup).toContain(financeObligations[0].title);
    expect(countOccurrences(markup, "This is a local summary from your entered data. It is not financial advice.")).toBe(
      1
    );
    expect(markup).not.toContain("This is a local summary from the data you entered.");
    expect(markup).toContain('id="finance-monthly-plan-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-charts-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-review-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-obligations-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-obligation-debt-1-details-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-transactions-records-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-add-transaction-content" hidden="" aria-hidden="true"');
    expect(markup).toContain('id="finance-add-obligation-content" hidden="" aria-hidden="true"');
  });
});
