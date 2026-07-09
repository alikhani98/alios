import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { FinanceObligation } from "@/shared/types";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import { Button, SoftPanel, StatusChip } from "@/shared/ui";
import { formatFinanceAmount } from "../financeCalculations";
import { FINANCE_OBLIGATION_STATUS_OPTIONS } from "../domain/finance";

type FinanceObligationCardProps = {
  obligation: FinanceObligation;
  isBusy: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

function getStatusTone(status: FinanceObligation["status"]) {
  switch (status) {
    case "paid":
      return "success";
    case "paused":
      return "warning";
    case "active":
    default:
      return "neutral";
  }
}

export function FinanceObligationCard({
  obligation,
  isBusy,
  onEdit,
  onDelete,
}: FinanceObligationCardProps) {
  const { language, t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const remainingAmount = Math.max(
    obligation.totalAmount - obligation.paidAmount,
    0
  );
  const paidPercentage =
    obligation.totalAmount > 0
      ? Math.min(100, Math.max((obligation.paidAmount / obligation.totalAmount) * 100, 0))
      : null;

  return (
    <SoftPanel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={getStatusTone(obligation.status)}>
              {t(
                FINANCE_OBLIGATION_STATUS_OPTIONS.find(
                  (option) => option.value === obligation.status
                )?.labelKey ?? "finance.statusActive"
              )}
            </StatusChip>
            <StatusChip tone="neutral">
              {t(
                obligation.type === "installment"
                  ? "finance.obligationTypeInstallment"
                  : "finance.obligationTypeDebt"
              )}
            </StatusChip>
          </div>
          <h3 className="text-lg font-semibold leading-7">{obligation.title}</h3>
          <p className="text-sm text-muted-foreground">
            {obligation.dueDate ? formatDate(obligation.dueDate) : null}
            {obligation.dueDate && obligation.dueDay ? " - " : null}
            {obligation.dueDay ? `${t("finance.dueDay")}: ${obligation.dueDay}` : null}
          </p>
        </div>
        <p className="text-lg font-semibold tabular-nums">
          {formatFinanceAmount(remainingAmount, language === "fa" ? "fa-IR" : "en-US")}{" "}
          {t("finance.currency")}
        </p>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-background/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("finance.totalAmount")}</p>
          <p className="mt-1 font-medium tabular-nums">
            {formatFinanceAmount(
              obligation.totalAmount,
              language === "fa" ? "fa-IR" : "en-US"
            )}{" "}
            {t("finance.currency")}
          </p>
        </div>
        <div className="rounded-2xl border bg-background/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("finance.paidAmount")}</p>
          <p className="mt-1 font-medium tabular-nums">
            {formatFinanceAmount(
              obligation.paidAmount,
              language === "fa" ? "fa-IR" : "en-US"
            )}{" "}
            {t("finance.currency")}
          </p>
        </div>
        <div className="rounded-2xl border bg-background/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("finance.remainingAmount")}</p>
          <p className="mt-1 font-medium tabular-nums">
            {formatFinanceAmount(remainingAmount, language === "fa" ? "fa-IR" : "en-US")}{" "}
            {t("finance.currency")}
          </p>
        </div>
        {paidPercentage !== null ? (
          <div className="rounded-2xl border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("finance.paidProgress")}</p>
            <p className="mt-1 font-medium tabular-nums">
              {t("finance.paidPercentage", {
                value: Math.round(paidPercentage),
              })}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground">
        {obligation.dueAmount !== undefined ? (
          <p>
            {t("finance.dueAmount")}:{" "}
            {formatFinanceAmount(
              obligation.dueAmount,
              language === "fa" ? "fa-IR" : "en-US"
            )}{" "}
            {t("finance.currency")}
          </p>
        ) : null}
        {obligation.monthlyAmount !== undefined ? (
          <p>
            {t("finance.monthlyAmount")}:{" "}
            {formatFinanceAmount(
              obligation.monthlyAmount,
              language === "fa" ? "fa-IR" : "en-US"
            )}{" "}
            {t("finance.currency")}
          </p>
        ) : null}
        {obligation.counterparty ? (
          <p>
            {t("finance.counterparty")}: {obligation.counterparty}
          </p>
        ) : null}
        {obligation.notes ? <p className="leading-7">{obligation.notes}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={onEdit}>
          <Pencil className="me-2 h-4 w-4" />
          {t("common.edit")}
        </Button>
        {confirmingDelete ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isBusy}
            onClick={() => void onDelete()}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {isBusy ? t("common.deleting") : t("common.confirmDelete")}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={isBusy}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t("common.delete")}
          </Button>
        )}
        {confirmingDelete ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => setConfirmingDelete(false)}
          >
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </SoftPanel>
  );
}
