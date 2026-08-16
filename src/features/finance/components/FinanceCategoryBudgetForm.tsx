import { useEffect, useMemo, useState } from "react";

import type {
  FinanceCategoryBudgetFormValues,
} from "../domain/finance";
import { FINANCE_CATEGORY_OPTIONS } from "../domain/finance";
import { useI18n } from "@/shared/i18n";
import type { FinanceCategoryBudget } from "@/shared/types";
import { Button, Input, Select } from "@/shared/ui";

type FinanceCategoryBudgetFormProps = {
  budgets: FinanceCategoryBudget[];
  isSubmitting?: boolean;
  onSubmit: (
    existingBudget: FinanceCategoryBudget | undefined,
    values: FinanceCategoryBudgetFormValues
  ) => Promise<void>;
  onDelete: (budget: FinanceCategoryBudget) => Promise<void>;
};

export function FinanceCategoryBudgetForm({
  budgets,
  isSubmitting = false,
  onSubmit,
  onDelete,
}: FinanceCategoryBudgetFormProps) {
  const { t } = useI18n();
  const [category, setCategory] = useState<string>(
    FINANCE_CATEGORY_OPTIONS[0].value
  );
  const [monthlyLimitAmount, setMonthlyLimitAmount] = useState("");
  const existingBudget = useMemo(
    () => budgets.find((budget) => budget.category === category),
    [budgets, category]
  );

  useEffect(() => {
    setMonthlyLimitAmount(
      existingBudget ? String(existingBudget.monthlyLimitAmount) : ""
    );
  }, [existingBudget]);

  const amount = Number(monthlyLimitAmount);
  const canSubmit =
    Number.isFinite(amount) && amount >= 0 && monthlyLimitAmount.trim().length > 0;

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();

        if (!canSubmit) {
          return;
        }

        void onSubmit(existingBudget, {
          category,
          monthlyLimitAmount: amount,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.65fr)]">
        <label className="grid gap-1.5 text-sm font-medium">
          <span>{t("finance.categoryBudgetCategory")}</span>
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isSubmitting}
          >
            {FINANCE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          <span>{t("finance.categoryBudgetLimit")}</span>
          <Input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={monthlyLimitAmount}
            onChange={(event) => setMonthlyLimitAmount(event.target.value)}
            placeholder={t("finance.categoryBudgetLimitPlaceholder")}
            disabled={isSubmitting}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {existingBudget
            ? t("finance.categoryBudgetUpdate")
            : t("finance.categoryBudgetCreate")}
        </Button>
        {existingBudget ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void onDelete(existingBudget)}
          >
            {t("finance.categoryBudgetDelete")}
          </Button>
        ) : null}
      </div>

      {budgets.length > 0 ? (
        <p className="text-xs leading-6 text-muted-foreground">
          {t("finance.categoryBudgetExisting", {
            count: budgets.length,
          })}
        </p>
      ) : null}
    </form>
  );
}
