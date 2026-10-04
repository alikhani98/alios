import { format, startOfMonth, subMonths } from "date-fns";
import { useMemo } from "react";

import { useI18n } from "@/shared/i18n";
import { SoftPanel } from "@/shared/ui";
import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

export interface FinanceForecastCardProps {
  transactions: FinanceTransaction[];
  obligations: FinanceObligation[];
  formatAmount: (value: number) => string;
}

type ForecastSummary = Readonly<{
  hasData: boolean;
  variableForecast: number;
  fixedForecast: number;
  total: number;
}>;

function toSafeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

export function FinanceForecastCard({
  transactions,
  obligations,
  formatAmount,
}: FinanceForecastCardProps) {
  const { t } = useI18n();
  const forecast = useMemo<ForecastSummary>(() => {
    const currentMonthStart = startOfMonth(new Date());
    const monthKeys = Array.from({ length: 3 }, (_, index) =>
      format(subMonths(currentMonthStart, index + 1), "yyyy-MM")
    );
    const expenseByMonth = new Map(monthKeys.map((monthKey) => [monthKey, 0]));

    for (const transaction of transactions) {
      if (transaction.type !== "expense") {
        continue;
      }

      const monthKey = transaction.occurredAt.slice(0, 7);
      if (!expenseByMonth.has(monthKey)) {
        continue;
      }

      expenseByMonth.set(
        monthKey,
        (expenseByMonth.get(monthKey) ?? 0) + toSafeAmount(transaction.amount)
      );
    }

    const monthValues = monthKeys.map((monthKey) => expenseByMonth.get(monthKey) ?? 0);
    const hasData = monthValues.some((amount) => amount > 0);
    const variableForecast =
      monthValues.reduce((total, amount) => total + amount, 0) / monthKeys.length;
    const fixedForecast = obligations
      .filter(
        (obligation) =>
          obligation.status === "active" &&
          typeof obligation.monthlyAmount === "number"
      )
      .reduce(
        (total, obligation) => total + toSafeAmount(obligation.monthlyAmount ?? 0),
        0
      );

    return {
      hasData,
      variableForecast,
      fixedForecast,
      total: variableForecast + fixedForecast,
    };
  }, [obligations, transactions]);

  return (
    <SoftPanel className="space-y-4 border-alios-saffron/25 bg-background/85">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">
          📊
        </span>
        <h3 className="text-lg font-semibold">{t("finance.forecast.title")}</h3>
      </div>

      {!forecast.hasData ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-5 text-sm leading-7 text-muted-foreground">
          {t("finance.forecast.noData")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {t("finance.forecast.variable")}
            </span>
            <span className="font-medium tabular-nums">
              {formatAmount(forecast.variableForecast)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {t("finance.forecast.fixed")}
            </span>
            <span className="font-medium tabular-nums">
              {formatAmount(forecast.fixedForecast)}
            </span>
          </div>
          <div className="border-t border-border/70" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">{t("finance.forecast.total")}</span>
            <span className="text-lg font-bold text-saffron-thread tabular-nums">
              {formatAmount(forecast.total)}
            </span>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {t("finance.forecast.basis")}
          </p>
        </div>
      )}
    </SoftPanel>
  );
}
