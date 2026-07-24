import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { FinanceObligation } from "@/shared/types";

import {
  FinanceObligationForm,
  normalizeFinanceObligationFormValues,
} from "../components/FinanceObligationForm";

const brokenActiveDebt: FinanceObligation = {
  id: "debt-rtl-1",
  type: "debt",
  title: "فعال",
  totalAmount: 2500,
  paidAmount: 600,
  status: "active",
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-24T08:30:00.000Z",
  dueAmount: Number.POSITIVE_INFINITY as number,
  monthlyAmount: Number.NaN as number,
  dueDay: 40,
  dueDate: "2026-13-99",
  counterparty: "   ",
  notes: "   ",
};

describe("FinanceObligationForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes missing or invalid optional fields before editing an active debt", () => {
    expect(normalizeFinanceObligationFormValues(brokenActiveDebt)).toEqual({
      type: "debt",
      title: "فعال",
      totalAmount: 2500,
      paidAmount: 600,
      dueAmount: undefined,
      monthlyAmount: undefined,
      dueDay: undefined,
      dueDate: undefined,
      counterparty: undefined,
      status: "active",
      notes: undefined,
    });
  });

  it("renders the edit form safely in Persian when optional debt fields are missing", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const html = renderToStaticMarkup(
      <I18nProvider>
        <DateDisplayProvider>
          <FinanceObligationForm
            obligation={brokenActiveDebt}
            isSubmitting={false}
            onSubmit={async () => undefined}
            onCancel={() => undefined}
          />
        </DateDisplayProvider>
      </I18nProvider>
    );

    expect(html).toContain("ذخیره تغییرات");
    expect(html).toContain("مقدار ذخیره‌شده همچنان ISO/Gregorian می‌ماند.");
  });
});
