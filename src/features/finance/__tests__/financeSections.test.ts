import { describe, expect, it } from "vitest";

import {
  FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY,
  financeQuickNavItems,
  getDefaultFinanceCollapsedSectionIds,
  normalizeFinanceCollapsedSectionIds,
} from "../financeSections";

describe("finance section helpers", () => {
  it("keeps the finance quick nav aligned with the main section anchors", () => {
    expect(financeQuickNavItems.map((item) => item.anchorId)).toEqual([
      "finance-summary",
      "finance-monthly-plan",
      "finance-charts",
      "finance-review",
      "finance-obligations",
      "finance-transactions",
      "finance-add",
    ]);
  });

  it("normalizes collapsed finance section ids safely", () => {
    expect(
      normalizeFinanceCollapsedSectionIds([
        "charts",
        "review",
        "charts",
        "invalid",
        "transactions",
      ])
    ).toEqual(["charts", "review", "transactions"]);
    expect(normalizeFinanceCollapsedSectionIds("not-an-array")).toEqual([]);
  });

  it("uses a localStorage-only finance collapse key", () => {
    expect(FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY).toBe(
      "alios.finance.collapsedSections"
    );
  });

  it("starts secondary finance sections collapsed on desktop and mobile", () => {
    expect(getDefaultFinanceCollapsedSectionIds(false)).toEqual([
      "charts",
      "review",
      "obligations",
      "transactions",
      "addTransaction",
      "addObligation",
      "importTransactions",
    ]);
    expect(getDefaultFinanceCollapsedSectionIds(true)).toEqual([
      "charts",
      "review",
      "obligations",
      "transactions",
      "addTransaction",
      "addObligation",
      "importTransactions",
    ]);
  });
});
