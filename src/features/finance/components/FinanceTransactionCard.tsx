import { Pencil, Trash2 } from "lucide-react";
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
    <SoftPanel className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
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
          <h3 className="text-lg font-semibold leading-7">{transaction.title}</h3>
          <p className="text-sm text-muted-foreground">{formatDate(transaction.occurredAt)}</p>
        </div>
        <p
          className={cn(
            "max-w-[10rem] break-words text-end text-lg font-semibold tabular-nums leading-7",
            transaction.type === "income"
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-destructive"
          )}
        >
          {amountLabel}
        </p>
      </div>

      {transaction.notes ? (
        <p className="text-sm leading-7 text-muted-foreground">{transaction.notes}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
        {confirmingDelete ? (
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
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full text-destructive hover:text-destructive sm:w-auto"
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
            className="w-full sm:w-auto"
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
