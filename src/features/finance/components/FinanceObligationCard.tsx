import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { FinanceObligation } from "@/shared/types";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  CollapsibleSection,
  MiniProgressBar,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
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
  const dueDateLabel = obligation.dueDate ? formatDate(obligation.dueDate) : t("finance.noDueDate");

  return (
    <SoftPanel className="space-y-4 border-border/70 bg-background/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
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
          <div className="space-y-1">
            <h3 className="break-words text-lg font-semibold leading-7">{obligation.title}</h3>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span>{dueDateLabel}</span>
              {obligation.dueDay ? (
                <span>
                  {t("finance.dueDay")}: {obligation.dueDay}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("finance.remainingAmount")}
          </p>
          <p className="mt-1 max-w-[12rem] break-words text-2xl font-semibold tabular-nums leading-8">
            {formatFinanceAmount(remainingAmount, language === "fa" ? "fa-IR" : "en-US")}{" "}
            {t("finance.currency")}
          </p>
        </div>
      </div>

      <CollapsibleSection
        id={`finance-obligation-${obligation.id}-details`}
        title={t("finance.obligationDetails")}
        description={t("finance.obligationDetailsDescription")}
        status={
          paidPercentage !== null ? (
            <StatusChip tone={paidPercentage >= 100 ? "success" : "primary"}>
              {t("finance.paidPercentage", {
                value: Math.round(paidPercentage),
              })}
            </StatusChip>
          ) : null
        }
        defaultOpen={false}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="border-border/70 bg-muted/35"
        contentClassName="space-y-4"
      >
        {paidPercentage !== null ? (
          <SoftPanel className="space-y-3 bg-background/80">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t("finance.paidProgress")}</p>
              <StatusChip tone={paidPercentage >= 100 ? "success" : "primary"}>
                {t("finance.paidPercentage", {
                  value: Math.round(paidPercentage),
                })}
              </StatusChip>
            </div>
            <MiniProgressBar value={paidPercentage} label={t("finance.paidProgress")} />
          </SoftPanel>
        ) : null}

        <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="alios-surface-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("finance.totalAmount")}</p>
            <p className="mt-1 font-medium tabular-nums">
              {formatFinanceAmount(
                obligation.totalAmount,
                language === "fa" ? "fa-IR" : "en-US"
              )}{" "}
              {t("finance.currency")}
            </p>
          </div>
          <div className="alios-surface-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("finance.paidAmount")}</p>
            <p className="mt-1 font-medium tabular-nums">
              {formatFinanceAmount(
                obligation.paidAmount,
                language === "fa" ? "fa-IR" : "en-US"
              )}{" "}
              {t("finance.currency")}
            </p>
          </div>
          <div className="alios-surface-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("finance.remainingAmount")}</p>
            <p className="mt-1 font-medium tabular-nums">
              {formatFinanceAmount(remainingAmount, language === "fa" ? "fa-IR" : "en-US")}{" "}
              {t("finance.currency")}
            </p>
          </div>
          <div className="alios-surface-muted px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("finance.dueDate")}</p>
            <p className="mt-1 font-medium">{dueDateLabel}</p>
          </div>
        </div>

        <div className="alios-surface-muted grid gap-2 px-4 py-3 text-sm text-muted-foreground">
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
      </CollapsibleSection>

      <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isBusy}
          onClick={onEdit}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t("common.edit")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full text-destructive hover:text-destructive sm:w-auto"
          disabled={isBusy}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="me-2 h-4 w-4" />
          {confirmingDelete ? t("common.confirmDelete") : t("common.delete")}
        </Button>
        {confirmingDelete ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isBusy}
              onClick={() => void onDelete()}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {isBusy ? t("common.deleting") : t("common.confirmDelete")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isBusy}
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : null}
      </div>
    </SoftPanel>
  );
}
