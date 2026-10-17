import { format, startOfMonth, subMonths } from "date-fns";
import { useMemo } from "react";
import { ChartNoAxesCombined } from "lucide-react";

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
  incomeForecast: number;
  variableForecast: number;
  fixedForecast: number;
  total: number;
  projectedBalance: number;
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
    const incomeByMonth = new Map(monthKeys.map((monthKey) => [monthKey, 0]));

    for (const transaction of transactions) {
      const monthKey = transaction.occurredAt.slice(0, 7);
      if (!expenseByMonth.has(monthKey) || !incomeByMonth.has(monthKey)) {
        continue;
      }

      if (transaction.type === "expense") {
        expenseByMonth.set(
          monthKey,
          (expenseByMonth.get(monthKey) ?? 0) + toSafeAmount(transaction.amount)
        );
      }

      if (transaction.type === "income") {
        incomeByMonth.set(
          monthKey,
          (incomeByMonth.get(monthKey) ?? 0) + toSafeAmount(transaction.amount)
        );
      }
    }

    const expenseMonthValues = monthKeys.map(
      (monthKey) => expenseByMonth.get(monthKey) ?? 0
    );
    const incomeMonthValues = monthKeys.map(
      (monthKey) => incomeByMonth.get(monthKey) ?? 0
    );
    const hasIncomeData = incomeMonthValues.some((amount) => amount > 0);
    const hasExpenseData = expenseMonthValues.some((amount) => amount > 0);
    const incomeForecast =
      hasIncomeData
        ? incomeMonthValues.reduce((total, amount) => total + amount, 0) /
          monthKeys.length
        : 0;
    const variableForecast =
      expenseMonthValues.reduce((total, amount) => total + amount, 0) /
      monthKeys.length;
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
    const total = variableForecast + fixedForecast;
    const projectedBalance = incomeForecast - total;
    const hasData = hasExpenseData || hasIncomeData || fixedForecast > 0;

    return {
      hasData,
      incomeForecast,
      variableForecast,
      fixedForecast,
      total,
      projectedBalance,
    };
  }, [obligations, transactions]);
  const projectedBalanceTone =
    forecast.projectedBalance > 0
      ? "text-success"
      : forecast.projectedBalance < 0
        ? "text-destructive"
        : "text-foreground";

  return (
    <SoftPanel className="finance-forecast space-y-4">
      <div className="flex items-center gap-2">
        <ChartNoAxesCombined aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{t("finance.forecast.title")}</h3>
      </div>

      {!forecast.hasData ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-5 text-sm leading-7 text-muted-foreground">
          {t("finance.forecast.noData")}
        </p>
      ) : (
        <div className="finance-forecast-values space-y-3">
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
            <span className="text-lg font-semibold tabular-nums">
              {formatAmount(forecast.total)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {t("finance.forecast.income")}
            </span>
            <span className="font-medium tabular-nums">
              {formatAmount(forecast.incomeForecast)}
            </span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold">
                {t("finance.forecast.projectedBalance")}
              </span>
              <span
                className={`text-xl font-bold tabular-nums ${projectedBalanceTone}`}
              >
                {formatAmount(forecast.projectedBalance)}
              </span>
            </div>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {t("finance.forecast.nextMonthBasis")}
          </p>
        </div>
      )}
    </SoftPanel>
  );
}
