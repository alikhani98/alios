import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { MoneyPause, MoneyPauseDecision } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

type MoneyPauseReviewCardProps = {
  refreshKey?: number;
  onChanged?: () => void;
};

function formatAmount(item: MoneyPause): string {
  if (item.currency === "IRR") {
    return `${item.amount.toLocaleString()} تومان`;
  }

  return `${item.amount.toLocaleString()} ${item.currency}`;
}

export function MoneyPauseReviewCard({
  refreshKey = 0,
  onChanged,
}: MoneyPauseReviewCardProps) {
  const { t } = useI18n();
  const { moneyPauses } = useStorageAdapter();
  const [items, setItems] = useState<MoneyPause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setItems(await moneyPauses.getPendingPauses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("money.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [moneyPauses, t]);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  const handleDecision = async (id: string, decision: MoneyPauseDecision) => {
    setBusyId(id);
    setError(null);

    try {
      await moneyPauses.decide(id, decision);
      setItems((current) => current.filter((item) => item.id !== id));
      await loadItems();
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("money.saveError"));
    } finally {
      setBusyId(null);
    }
  };

  if (!isLoading && items.length === 0 && !error) {
    return null;
  }

  return (
    <Card className="alios-home-context-shelf overflow-hidden border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t("money.reviewTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="h-24 animate-pulse rounded-2xl border bg-muted/60" />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border bg-background/80 p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0 space-y-1">
                <p className="break-words font-semibold">
                  {item.item} — {formatAmount(item)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("money.reviewQuestion")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void handleDecision(item.id, "buy")}
                >
                  {t("money.reviewDecisionBuy")}
                </Button>
                <Button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void handleDecision(item.id, "skip")}
                >
                  {t("money.reviewDecisionSkip")}
                </Button>
              </div>
            </div>
          ))
        )}

        {error ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadItems()}
          >
            <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
