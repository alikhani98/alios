import { useEffect, useState } from "react";

import { useI18n } from "@/shared/i18n";
import type { FinanceAsset } from "@/shared/types";
import { Button, Input, Select, Textarea } from "@/shared/ui";
import {
  DEFAULT_FINANCE_ASSET_TYPE,
  FINANCE_ASSET_TYPE_OPTIONS,
  type FinanceAssetFormValues,
} from "../domain/finance";

type FinanceAssetFormProps = {
  asset?: FinanceAsset;
  isSubmitting: boolean;
  onSubmit: (values: FinanceAssetFormValues) => Promise<void>;
  onCancel?: () => void;
};

function toOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function FinanceAssetForm({
  asset,
  isSubmitting,
  onSubmit,
  onCancel,
}: FinanceAssetFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(asset?.title ?? "");
  const [type, setType] = useState<FinanceAssetFormValues["type"]>(
    asset?.type ?? DEFAULT_FINANCE_ASSET_TYPE
  );
  const [currentValue, setCurrentValue] = useState(
    asset ? String(asset.currentValue) : ""
  );
  const [notes, setNotes] = useState(asset?.notes ?? "");

  useEffect(() => {
    setTitle(asset?.title ?? "");
    setType(asset?.type ?? DEFAULT_FINANCE_ASSET_TYPE);
    setCurrentValue(asset ? String(asset.currentValue) : "");
    setNotes(asset?.notes ?? "");
  }, [asset]);

  const value = Number(currentValue);
  const canSubmit =
    title.trim().length > 0 &&
    currentValue.trim().length > 0 &&
    Number.isFinite(value) &&
    value >= 0;

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        if (!canSubmit) {
          return;
        }

        void onSubmit({
          title: title.trim(),
          type,
          currentValue: value,
          notes: toOptionalText(notes),
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="grid gap-2 text-sm font-medium">
          <span>{t("common.title")}</span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("finance.assetTitlePlaceholder")}
            disabled={isSubmitting}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>{t("common.type")}</span>
          <Select
            value={type}
            onChange={(event) =>
              setType(event.target.value as FinanceAssetFormValues["type"])
            }
            disabled={isSubmitting}
          >
            {FINANCE_ASSET_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <label className="grid gap-2 text-sm font-medium">
          <span>{t("finance.assetCurrentValue")}</span>
          <Input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={currentValue}
            onChange={(event) => setCurrentValue(event.target.value)}
            placeholder={t("finance.assetValuePlaceholder")}
            disabled={isSubmitting}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>{t("common.notes")}</span>
          <Textarea
            className="min-h-24"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("finance.assetNotesPlaceholder")}
            disabled={isSubmitting}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : asset
              ? t("common.saveChanges")
              : t("finance.addAsset")}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
