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
    <SoftPanel className="finance-record space-y-3">
      <div className="finance-record-heading">
        <div className="finance-record-main min-w-0 space-y-2">
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
            <h3 className="break-words text-base font-semibold leading-7">{transaction.title}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(transaction.occurredAt)}</p>
          </div>
        </div>
        <div className="finance-record-amount">
          <p className="text-xs font-medium text-muted-foreground">
            {t("finance.amount")}
          </p>
          <p
            className={cn(
              "mt-1 break-words text-xl font-semibold tabular-nums leading-8",
              transaction.type === "income" ? "text-success" : "text-destructive"
            )}
          >
            {amountLabel}
          </p>
        </div>
      </div>

      {transaction.notes ? (
        <div className="finance-record-notes space-y-1">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ReceiptText className="h-4 w-4 shrink-0" />
            {t("common.notes")}
          </p>
          <p className="text-sm leading-7 text-muted-foreground">{transaction.notes}</p>
        </div>
      ) : null}

      <div className="finance-record-actions flex flex-wrap items-center gap-2">
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
