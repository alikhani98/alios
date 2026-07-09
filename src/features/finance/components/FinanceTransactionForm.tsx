import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";

import type { FinanceTransaction } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea } from "@/shared/ui";
import {
  DEFAULT_FINANCE_TRANSACTION_CATEGORY,
  FINANCE_CATEGORY_OPTIONS,
  FINANCE_TRANSACTION_TYPE_OPTIONS,
  type FinanceTransactionFormValues,
} from "../domain/finance";
import { financeTransactionSchema } from "@/shared/types";

type FinanceTransactionFormProps = {
  transaction?: FinanceTransaction;
  isSubmitting: boolean;
  onSubmit: (values: FinanceTransactionFormValues) => Promise<void>;
  onCancel?: () => void;
};

const financeTransactionFormSchema = financeTransactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

function toOptionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function FinanceTransactionForm({
  transaction,
  isSubmitting,
  onSubmit,
  onCancel,
}: FinanceTransactionFormProps) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinanceTransactionFormValues>({
    resolver: zodResolver(financeTransactionFormSchema),
    defaultValues: {
      type: transaction?.type ?? "income",
      title: transaction?.title ?? "",
      amount: transaction?.amount ?? 0,
      category:
        transaction?.category ??
        DEFAULT_FINANCE_TRANSACTION_CATEGORY[transaction?.type ?? "income"],
      occurredAt: transaction?.occurredAt ?? format(new Date(), "yyyy-MM-dd"),
      notes: transaction?.notes ?? "",
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <label htmlFor="finance-transaction-title" className="text-sm font-medium">
            {t("common.title")}
          </label>
          <Input
            id="finance-transaction-title"
            autoFocus
            placeholder={t("finance.transactionTitlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-transaction-type" className="text-sm font-medium">
            {t("common.type")}
          </label>
          <select
            id="finance-transaction-type"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            {...register("type")}
          >
            {FINANCE_TRANSACTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor="finance-transaction-amount" className="text-sm font-medium">
            {t("finance.amount")}
          </label>
          <Input
            id="finance-transaction-amount"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.amount)}
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount ? (
            <p className="text-sm text-destructive">{t("finance.amountValidation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-transaction-category" className="text-sm font-medium">
            {t("finance.category")}
          </label>
          <select
            id="finance-transaction-category"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            {...register("category")}
          >
            {FINANCE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-transaction-date" className="text-sm font-medium">
            {t("common.date")}
          </label>
          <Input
            id="finance-transaction-date"
            type="date"
            aria-invalid={Boolean(errors.occurredAt)}
            {...register("occurredAt")}
          />
          {errors.occurredAt ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="finance-transaction-notes" className="text-sm font-medium">
          {t("common.notes")}
        </label>
        <Textarea
          id="finance-transaction-notes"
          placeholder={t("finance.notesPlaceholder")}
          {...register("notes", { setValueAs: toOptionalString })}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : transaction
              ? t("common.saveChanges")
              : t("finance.addTransaction")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
