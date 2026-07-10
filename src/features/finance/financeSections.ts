import type { TranslationKey } from "@/shared/i18n";

export const FINANCE_SECTION_ANCHORS = {
  summary: "finance-summary",
  monthlyPlan: "finance-monthly-plan",
  charts: "finance-charts",
  review: "finance-review",
  obligations: "finance-obligations",
  transactions: "finance-transactions",
  add: "finance-add",
  addTransaction: "finance-add-transaction",
  addObligation: "finance-add-obligation",
} as const;

export type FinanceSectionId = keyof typeof FINANCE_SECTION_ANCHORS;

export type FinanceQuickNavItem = {
  id: FinanceSectionId;
  labelKey: TranslationKey;
  anchorId: (typeof FINANCE_SECTION_ANCHORS)[FinanceSectionId];
};

export const financeQuickNavItems: ReadonlyArray<FinanceQuickNavItem> = [
  {
    id: "summary",
    labelKey: "finance.sectionSummary",
    anchorId: FINANCE_SECTION_ANCHORS.summary,
  },
  {
    id: "monthlyPlan",
    labelKey: "finance.sectionMonthlyPlan",
    anchorId: FINANCE_SECTION_ANCHORS.monthlyPlan,
  },
  {
    id: "charts",
    labelKey: "finance.sectionCharts",
    anchorId: FINANCE_SECTION_ANCHORS.charts,
  },
  {
    id: "review",
    labelKey: "finance.sectionReview",
    anchorId: FINANCE_SECTION_ANCHORS.review,
  },
  {
    id: "obligations",
    labelKey: "finance.sectionObligations",
    anchorId: FINANCE_SECTION_ANCHORS.obligations,
  },
  {
    id: "transactions",
    labelKey: "finance.sectionTransactions",
    anchorId: FINANCE_SECTION_ANCHORS.transactions,
  },
  {
    id: "add",
    labelKey: "finance.sectionAdd",
    anchorId: FINANCE_SECTION_ANCHORS.add,
  },
] as const;

export type FinanceCollapsibleSectionId =
  | "charts"
  | "review"
  | "obligations"
  | "transactions"
  | "addTransaction"
  | "addObligation";

export const financeCollapsibleSectionIds: ReadonlyArray<FinanceCollapsibleSectionId> = [
  "charts",
  "review",
  "obligations",
  "transactions",
  "addTransaction",
  "addObligation",
] as const;

export const FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY =
  "alios.finance.collapsedSections";

export function isFinanceCollapsibleSectionId(
  value: unknown
): value is FinanceCollapsibleSectionId {
  return (
    typeof value === "string" &&
    financeCollapsibleSectionIds.includes(value as FinanceCollapsibleSectionId)
  );
}

export function normalizeFinanceCollapsedSectionIds(
  value: unknown
): FinanceCollapsibleSectionId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: FinanceCollapsibleSectionId[] = [];

  for (const entry of value) {
    if (isFinanceCollapsibleSectionId(entry) && !result.includes(entry)) {
      result.push(entry);
    }
  }

  return result;
}

export function readStoredFinanceCollapsedSectionIds():
  | FinanceCollapsibleSectionId[]
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(
      FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY
    );

    if (stored === null) {
      return null;
    }

    return normalizeFinanceCollapsedSectionIds(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function writeStoredFinanceCollapsedSectionIds(
  value: readonly FinanceCollapsibleSectionId[]
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY,
      JSON.stringify(Array.from(new Set(value)))
    );
  } catch {
    // Keep the UI state in memory if localStorage is unavailable.
  }
}

export function getDefaultFinanceCollapsedSectionIds(isMobile: boolean) {
  return isMobile ? [...financeCollapsibleSectionIds] : [];
}
