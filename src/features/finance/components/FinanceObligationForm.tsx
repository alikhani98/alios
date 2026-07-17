import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";

import type { FinanceObligation } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea, Select } from "@/shared/ui";
import {
  DEFAULT_FINANCE_OBLIGATION_STATUS,
  DEFAULT_FINANCE_OBLIGATION_TYPE,
  FINANCE_OBLIGATION_STATUS_OPTIONS,
  FINANCE_OBLIGATION_TYPE_OPTIONS,
  type FinanceObligationFormValues,
} from "../domain/finance";
import { getJalaliDatePreview } from "../financeDate";
import { financeObligationSchema } from "@/shared/types";

type FinanceObligationFormProps = {
  obligation?: FinanceObligation;
  isSubmitting: boolean;
  onSubmit: (values: FinanceObligationFormValues) => Promise<void>;
  onCancel?: () => void;
};

const financeObligationFormSchema = financeObligationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

function toOptionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : undefined;
}

export function FinanceObligationForm({
  obligation,
  isSubmitting,
  onSubmit,
  onCancel,
}: FinanceObligationFormProps) {
  const { language, t } = useI18n();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FinanceObligationFormValues>({
    resolver: zodResolver(financeObligationFormSchema),
    defaultValues: {
      type: obligation?.type ?? DEFAULT_FINANCE_OBLIGATION_TYPE,
      title: obligation?.title ?? "",
      totalAmount: obligation?.totalAmount ?? 0,
      paidAmount: obligation?.paidAmount ?? 0,
      dueAmount: obligation?.dueAmount,
      monthlyAmount: obligation?.monthlyAmount,
      dueDay: obligation?.dueDay,
      dueDate: obligation?.dueDate ?? "",
      counterparty: obligation?.counterparty ?? "",
      status: obligation?.status ?? DEFAULT_FINANCE_OBLIGATION_STATUS,
      notes: obligation?.notes ?? "",
    },
  });
  const dueDateValue = watch("dueDate");
  const jalaliDueDatePreview = getJalaliDatePreview(dueDateValue, language);

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <label htmlFor="finance-obligation-title" className="text-sm font-medium">
            {t("common.title")}
          </label>
          <Input
            id="finance-obligation-title"
            autoFocus
            placeholder={t("finance.obligationTitlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-obligation-type" className="text-sm font-medium">
            {t("common.type")}
          </label>
          <Select
            id="finance-obligation-type"
            {...register("type")}
          >
            {FINANCE_OBLIGATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="finance-obligation-total" className="text-sm font-medium">
            {t("finance.totalAmount")}
          </label>
          <Input
            id="finance-obligation-total"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.totalAmount)}
            {...register("totalAmount", { valueAsNumber: true })}
          />
          {errors.totalAmount ? (
            <p className="text-sm text-destructive">{t("finance.amountValidation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-obligation-paid" className="text-sm font-medium">
            {t("finance.paidAmount")}
          </label>
          <Input
            id="finance-obligation-paid"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.paidAmount)}
            {...register("paidAmount", { valueAsNumber: true })}
          />
          {errors.paidAmount ? (
            <p className="text-sm text-destructive">{t("finance.amountValidation")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="finance-obligation-due-amount" className="text-sm font-medium">
            {t("finance.dueAmount")}
          </label>
          <Input
            id="finance-obligation-due-amount"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.dueAmount)}
            {...register("dueAmount", { setValueAs: toOptionalNumber })}
          />
          {errors.dueAmount ? (
            <p className="text-sm text-destructive">{t("finance.amountValidation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-obligation-monthly-amount" className="text-sm font-medium">
            {t("finance.monthlyAmount")}
          </label>
          <Input
            id="finance-obligation-monthly-amount"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.monthlyAmount)}
            {...register("monthlyAmount", { setValueAs: toOptionalNumber })}
          />
          {errors.monthlyAmount ? (
            <p className="text-sm text-destructive">{t("finance.amountValidation")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="finance-obligation-due-day" className="text-sm font-medium">
            {t("finance.dueDay")}
          </label>
          <Input
            id="finance-obligation-due-day"
            type="number"
            min="1"
            max="31"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.dueDay)}
            {...register("dueDay", { setValueAs: toOptionalNumber })}
          />
          {errors.dueDay ? (
            <p className="text-sm text-destructive">{t("finance.dueDayValidation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="finance-obligation-due-date" className="text-sm font-medium">
            {t("finance.dueDate")}
          </label>
          <Input
            id="finance-obligation-due-date"
            type="date"
            aria-invalid={Boolean(errors.dueDate)}
            {...register("dueDate", {
              setValueAs: (value: string) => {
                const trimmed = value.trim();
                return trimmed.length > 0 ? trimmed : undefined;
              },
            })}
          />
          <div className="space-y-1 text-xs leading-5 text-muted-foreground">
            {jalaliDueDatePreview ? (
              <p className="break-words">
                {t("finance.jalaliDueDatePreview")} {jalaliDueDatePreview}
              </p>
            ) : null}
            <p>{t("finance.dueDateStorageNote")}</p>
          </div>
          {errors.dueDate ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="finance-obligation-counterparty" className="text-sm font-medium">
          {t("finance.counterparty")}
        </label>
        <Input
          id="finance-obligation-counterparty"
          placeholder={t("finance.counterpartyPlaceholder")}
          {...register("counterparty", { setValueAs: toOptionalString })}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="finance-obligation-status" className="text-sm font-medium">
          {t("common.status")}
        </label>
        <Select
          id="finance-obligation-status"
          {...register("status")}
        >
          {FINANCE_OBLIGATION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="finance-obligation-notes" className="text-sm font-medium">
          {t("common.notes")}
        </label>
        <Textarea
          id="finance-obligation-notes"
          placeholder={t("finance.notesPlaceholder")}
          {...register("notes", { setValueAs: toOptionalString })}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : obligation
              ? t("common.saveChanges")
              : t("finance.addObligation")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
