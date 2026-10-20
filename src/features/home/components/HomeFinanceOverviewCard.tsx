import { Eye, EyeOff, RotateCcw, Wallet } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";

import { formatFinanceAmount } from "@/features/finance/financeCalculations";
import { formatDisplayDate } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent } from "@/shared/ui";
import type { HomeFinanceOverviewState } from "../homeFinanceOverview";

type Props = { state: HomeFinanceOverviewState; onRetry: () => void };

export function HomeFinanceOverviewCard({ state, onRetry }: Props) {
  const { language, direction, t } = useI18n();
  const titleId = useId();
  const [amountsVisible, setAmountsVisible] = useState(false);
  const { data, isLoading, hasError } = state;
  const locale = language === "fa" ? "fa-IR" : "en-US";
  const date = (value: string) => formatDisplayDate(value, { language, calendar: "gregorian" });
  const metrics = data ? [
    { label: t("home.financeRecordedIncome"), value: data.incomeThisMonth },
    { label: t("home.financeRecordedExpenses"), value: data.expensesThisMonth },
    { label: t("home.financeTransactionNet"), value: data.transactionNet },
  ] : [];

  return (
    <Card role="region" aria-labelledby={titleId} dir={direction} className="min-w-0 alios-home-context-shelf">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-lg font-semibold">
            <Wallet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            {t("home.financeOverviewTitle")}
          </h2>
          <Button type="button" variant="ghost" size="icon"
            aria-label={t(amountsVisible ? "home.financeHideAmounts" : "home.financeShowAmounts")}
            aria-pressed={amountsVisible} disabled={!data}
            onClick={() => setAmountsVisible((visible) => !visible)}>
            {amountsVisible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>

        <div role="status" className={isLoading || hasError ? "space-y-2 text-sm leading-6 text-muted-foreground" : "sr-only"}>
          {isLoading ? <p>{t(data ? "home.financeRefreshing" : "home.financeLoading")}</p> : null}
          {hasError ? <p>{t(data ? "home.financeStale" : "home.financeError")}</p> : null}
        </div>
        {hasError ? (
          <Button type="button" variant="outline" disabled={isLoading} onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />{t("home.financeRetry")}
          </Button>
        ) : null}

        {data ? (
          <>
            <p className="text-xs leading-6 text-muted-foreground">
              {t("home.financeGregorianMonth", { start: date(data.monthStart), end: date(data.monthEnd) })}
            </p>
            {data.transactionCount === 0 && data.obligationCount === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">{t("home.financeEmpty")}</p>
            ) : data.monthlyTransactionCount === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">{t("home.financeNoMonthlyTransactions")}</p>
            ) : null}
            <dl className="grid min-w-0 gap-4 sm:grid-cols-3">
              {metrics.map(({ label, value }, index) => (
                <div key={label} className={`min-w-0 border-s-2 ps-3 ${index === 2 ? "border-primary/50" : "border-border"}`}>
                  <dt className="text-xs leading-6 text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words text-lg font-semibold tabular-nums [overflow-wrap:anywhere]">
                    {amountsVisible ? (
                      <><bdi>{formatFinanceAmount(value, locale)}</bdi> <span className="text-xs font-normal">{t("finance.currency")}</span></>
                    ) : <span aria-label={t("home.financeAmountsHidden")}>••••</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <dl className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-sm">
              <dt className="text-muted-foreground">{t("home.financeActiveObligations")}</dt>
              <dd className="font-semibold tabular-nums">{new Intl.NumberFormat(locale).format(data.activeObligationCount)}</dd>
            </dl>
          </>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-xs leading-6 text-muted-foreground">{t("home.financeDisclaimer")}</p>
          <Button asChild variant="outline" className="max-w-full"><Link to="/finance">{t("home.financeOpen")}</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
