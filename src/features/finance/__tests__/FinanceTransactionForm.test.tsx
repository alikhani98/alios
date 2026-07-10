import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { FinanceTransactionForm } from "../components/FinanceTransactionForm";

describe("FinanceTransactionForm", () => {
  beforeEach(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders a Jalali preview for the transaction date", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <FinanceTransactionForm
          transaction={{
            id: "transaction-1",
            type: "income",
            title: "Salary",
            amount: 100,
            category: "salary",
            occurredAt: "2026-07-05",
            notes: undefined,
            createdAt: "2026-07-05T00:00:00.000Z",
            updatedAt: "2026-07-05T00:00:00.000Z",
          }}
          isSubmitting={false}
          onSubmit={async () => undefined}
        />
      </I18nProvider>
    );

    expect(markup).toContain("Jalali display:");
  });
});
