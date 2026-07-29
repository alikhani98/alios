import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { I18nProvider } from "@/shared/i18n";

import { FinanceTransactionForm } from "../components/FinanceTransactionForm";

describe("FinanceTransactionForm", () => {
  it("shows income-focused categories and helper copy by default", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <FinanceTransactionForm
          isSubmitting={false}
          onSubmit={async () => undefined}
        />
      </I18nProvider>
    );

    expect(markup).toContain("منبع درآمدی را انتخاب کنید که بیشترین تطابق را با این مورد دارد.");
    expect(markup).toContain(">حقوق<");
    expect(markup).toContain(">فریلنس<");
    expect(markup).not.toContain(">اجاره<");
  });

  it("shows expense-focused categories for expense transactions", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <FinanceTransactionForm
          transaction={{
            id: "expense-1",
            type: "expense",
            title: "Groceries",
            amount: 1200,
            category: "groceries",
            occurredAt: "2026-07-29",
            createdAt: "2026-07-29T08:00:00.000Z",
            updatedAt: "2026-07-29T08:00:00.000Z",
          }}
          isSubmitting={false}
          onSubmit={async () => undefined}
        />
      </I18nProvider>
    );

    expect(markup).toContain("دستهٔ هزینه‌ای را انتخاب کنید که بیشترین تطابق را با این خرج دارد.");
    expect(markup).toContain(">خواربار<");
    expect(markup).toContain(">اجاره<");
    expect(markup).not.toContain(">حقوق<");
  });
});
