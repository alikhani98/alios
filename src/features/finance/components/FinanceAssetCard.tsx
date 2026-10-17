import { Pencil, Trash2, WalletCards } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import type { FinanceAsset } from "@/shared/types";
import { Button, SoftPanel, StatusChip } from "@/shared/ui";
import { formatFinanceAmount } from "../financeCalculations";
import { FINANCE_ASSET_TYPE_OPTIONS } from "../domain/finance";

type FinanceAssetCardProps = {
  asset: FinanceAsset;
  isBusy: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

function getAssetTypeLabelKey(asset: FinanceAsset) {
  return (
    FINANCE_ASSET_TYPE_OPTIONS.find((option) => option.value === asset.type)
      ?.labelKey ?? "finance.assetTypeOther"
  );
}

export function FinanceAssetCard({
  asset,
  isBusy,
  onEdit,
  onDelete,
}: FinanceAssetCardProps) {
  const { language, t } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const locale = language === "fa" ? "fa-IR" : "en-US";

  return (
    <SoftPanel className="finance-record space-y-3">
      <div className="finance-record-heading">
        <div className="finance-record-main min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="primary">
              <WalletCards className="me-1 h-3.5 w-3.5" />
              {t(getAssetTypeLabelKey(asset))}
            </StatusChip>
          </div>
          <div className="space-y-1">
            <h3 className="break-words text-base font-semibold leading-7">
              {asset.title}
            </h3>
            {asset.notes ? (
              <p className="break-words text-sm leading-7 text-muted-foreground">
                {asset.notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="finance-record-amount">
          <p className="text-xs font-medium text-muted-foreground">
            {t("finance.assetCurrentValue")}
          </p>
          <p className="mt-1 break-words text-xl font-semibold tabular-nums leading-8">
            {formatFinanceAmount(asset.currentValue, locale)}{" "}
            {t("finance.currency")}
          </p>
        </div>
      </div>

      <div className="finance-record-actions flex flex-wrap items-center gap-2">
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
              {t("common.confirmDelete")}
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
