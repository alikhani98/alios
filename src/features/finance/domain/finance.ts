import type {
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  UpdateFinanceObligationInput,
  UpdateFinanceTransactionInput,
} from "@/core/repositories";
import {
  FINANCE_OBLIGATION_STATUS_VALUES,
  FINANCE_OBLIGATION_TYPE_VALUES,
  FINANCE_TRANSACTION_TYPE_VALUES,
  type FinanceObligationStatus,
  type FinanceObligationType,
  type FinanceTransactionType,
} from "@/shared/types";

export type FinanceTransactionFormValues = CreateFinanceTransactionInput;
export type FinanceTransactionUpdateValues = UpdateFinanceTransactionInput;
export type FinanceObligationFormValues = CreateFinanceObligationInput;
export type FinanceObligationUpdateValues = UpdateFinanceObligationInput;

export const FINANCE_TRANSACTION_TYPE_OPTIONS = FINANCE_TRANSACTION_TYPE_VALUES.map(
  (value) =>
    ({
      value,
      labelKey:
        value === "income"
          ? "finance.transactionTypeIncome"
          : "finance.transactionTypeExpense",
    }) as const
);

export const FINANCE_OBLIGATION_TYPE_OPTIONS = FINANCE_OBLIGATION_TYPE_VALUES.map(
  (value) =>
    ({
      value,
      labelKey:
        value === "installment"
          ? "finance.obligationTypeInstallment"
          : "finance.obligationTypeDebt",
    }) as const
);

export const FINANCE_OBLIGATION_STATUS_OPTIONS = FINANCE_OBLIGATION_STATUS_VALUES.map(
  (value) =>
    ({
      value,
      labelKey:
        value === "active"
          ? "finance.statusActive"
          : value === "paid"
            ? "finance.statusPaid"
            : "finance.statusPaused",
    }) as const
);

export const FINANCE_CATEGORY_OPTIONS = [
  { value: "salary", labelKey: "finance.categorySalary" },
  { value: "freelance", labelKey: "finance.categoryFreelance" },
  { value: "bonus", labelKey: "finance.categoryBonus" },
  { value: "rent", labelKey: "finance.categoryRent" },
  { value: "groceries", labelKey: "finance.categoryGroceries" },
  { value: "transport", labelKey: "finance.categoryTransport" },
  { value: "utilities", labelKey: "finance.categoryUtilities" },
  { value: "health", labelKey: "finance.categoryHealth" },
  { value: "debt-payment", labelKey: "finance.categoryDebtPayment" },
  { value: "other", labelKey: "finance.categoryOther" },
] as const;

export type FinanceCategoryLabelKey =
  (typeof FINANCE_CATEGORY_OPTIONS)[number]["labelKey"];

export const DEFAULT_FINANCE_TRANSACTION_CATEGORY: Record<
  FinanceTransactionType,
  string
> = {
  income: "salary",
  expense: "groceries",
};

export const DEFAULT_FINANCE_OBLIGATION_TYPE: FinanceObligationType =
  "installment";

export const DEFAULT_FINANCE_OBLIGATION_STATUS: FinanceObligationStatus =
  "active";

export function getFinanceTransactionCategoryLabelKey(
  category: string
): FinanceCategoryLabelKey {
  return (
    FINANCE_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.labelKey ?? "finance.categoryOther"
  ) as FinanceCategoryLabelKey;
}
