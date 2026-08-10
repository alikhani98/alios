import { Pencil, ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";

import type { FinanceTransaction } from "@/shared/types";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import { Button, SoftPanel, StatusChip } from "@/shared/ui";
import { cn } from "@/shared/utils";
import { getFinanceTransactionCategoryLabelKey } from "../domain/finance";
import { formatFinanceAmount } from "../financeCalculations";

type FinanceTransactionCardProps = {
  transaction: FinanceTransaction;
  isBusy: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function FinanceTransactionCard({
  transaction,
  isBusy,
  onEdit,
  onDelete,
}: FinanceTransactionCardProps) {
  const { language, t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const amountLabel = `${formatFinanceAmount(
    transaction.amount,
    language === "fa" ? "fa-IR" : "en-US"
  )} ${t("finance.currency")}`;

  const typeTone = transaction.type === "income" ? "success" : "danger";

  return (
    <SoftPanel className="space-y-4 border-border/70 bg-background/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={typeTone}>
              {t(
                transaction.type === "income"
                  ? "finance.transactionTypeIncome"
                  : "finance.transactionTypeExpense"
              )}
            </StatusChip>
            <StatusChip tone="neutral">
              {t(getFinanceTransactionCategoryLabelKey(transaction.category))}
            </StatusChip>
          </div>
          <div className="space-y-1">
            <h3 className="break-words text-lg font-semibold leading-7">{transaction.title}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(transaction.occurredAt)}</p>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("finance.amount")}
          </p>
          <p
            className={cn(
              "mt-1 max-w-[12rem] break-words text-2xl font-semibold tabular-nums leading-8",
              transaction.type === "income" ? "text-success" : "text-destructive"
            )}
          >
            {amountLabel}
          </p>
        </div>
      </div>

      {transaction.notes ? (
        <SoftPanel className="space-y-2 bg-muted/60">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ReceiptText className="h-4 w-4 shrink-0" />
            {t("common.notes")}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">{transaction.notes}</p>
        </SoftPanel>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          variant="outline"
          disabled={isBusy}
          onClick={onEdit}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t("common.edit")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isBusy}
          variant="ghost"
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
