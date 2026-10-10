import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { MoneyPauseCurrency, MoneyPauseReason } from "@/shared/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/shared/ui";
import { cn } from "@/shared/utils";

const REASONS = [
  { value: "need", labelKey: "money.reasonNeed" },
  { value: "fun", labelKey: "money.reasonFun" },
  { value: "excitement", labelKey: "money.reasonExcitement" },
  { value: "discount", labelKey: "money.reasonDiscount" },
  { value: "boredom", labelKey: "money.reasonBoredom" },
] as const satisfies ReadonlyArray<{
  value: MoneyPauseReason;
  labelKey: TranslationKey;
}>;

type MoneyPauseFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type ChipButtonProps = {
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

function ChipButton({ isSelected, label, onClick }: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-accent"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function MoneyPauseForm({ open, onClose, onSaved }: MoneyPauseFormProps) {
  const { t, direction } = useI18n();
  const { moneyPauses } = useStorageAdapter();
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<MoneyPauseCurrency>("IRR");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [reason, setReason] = useState<MoneyPauseReason>("need");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const amountValue = Number(amount);
  const canSubmit = item.trim().length > 0 && amountValue > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await moneyPauses.addPause({
        item: item.trim(),
        amount: amountValue,
        currency,
        reason,
      });
      setItem("");
      setAmount("");
      setCurrency("IRR");
      setShowCurrencyPicker(false);
      setReason("need");
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("money.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="money-pause-form-title"
      dir={direction}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("common.cancel")}
        onClick={onClose}
      />
      <Card className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto border-border/70 bg-card shadow-aliosFloating">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle id="money-pause-form-title">
            {t("money.formTitle")}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.cancel")}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            {error ? (
              <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="money-pause-item" className="text-sm font-semibold">
                {t("money.fieldItem")}
              </label>
              <Input
                id="money-pause-item"
                required
                value={item}
                onChange={(event) => setItem(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="money-pause-amount" className="text-sm font-semibold">
                {t("money.fieldAmount")}
              </label>
              <Input
                id="money-pause-amount"
                required
                min="1"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              {showCurrencyPicker ? (
                <div className="grid max-w-48 grid-cols-2 gap-2">
                  {(["IRR", "USD"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={currency === value ? "default" : "outline"}
                      onClick={() => setCurrency(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-auto px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-primary"
                  onClick={() => setShowCurrencyPicker(true)}
                >
                  {t("money.changeCurrency")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("money.fieldReason")}</p>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((option) => (
                  <ChipButton
                    key={option.value}
                    isSelected={reason === option.value}
                    label={t(option.labelKey)}
                    onClick={() => setReason(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!canSubmit || isSubmitting}
              >
                {t("money.submitPause")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
