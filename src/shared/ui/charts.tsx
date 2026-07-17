import * as React from "react";

import { cn } from "@/shared/utils/cn";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

type HorizontalBarListItem = {
  id: string;
  label: React.ReactNode;
  amount: React.ReactNode;
  percent: number;
  meta?: React.ReactNode;
};

export type HorizontalBarListProps = {
  items: HorizontalBarListItem[];
  className?: string;
  emptyState?: React.ReactNode;
  "aria-label"?: string;
};

export function HorizontalBarList({
  items,
  className,
  emptyState,
  ...props
}: HorizontalBarListProps) {
  if (items.length === 0) {
    return emptyState ? <div className={cn("text-sm text-muted-foreground", className)}>{emptyState}</div> : null;
  }

  return (
    <ul className={cn("space-y-3", className)} {...props}>
      {items.map((item) => {
        const width = clampPercent(item.percent);

        return (
          <li
            key={item.id}
            className="group space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="break-words font-medium leading-6">{item.label}</p>
                {item.meta ? (
                  <p className="text-xs leading-6 text-muted-foreground">{item.meta}</p>
                ) : null}
              </div>
              <div className="shrink-0 text-end">
                <p className="text-base font-semibold tabular-nums leading-6">{item.amount}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{Math.round(width)}%</p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type MiniCashflowBarItem = {
  id: string;
  label: React.ReactNode;
  income: number;
  expenses: number;
  obligations: number;
  remainingLiquidity: number;
};

export type MiniCashflowBarsProps = {
  items: MiniCashflowBarItem[];
  incomeLabel: React.ReactNode;
  expensesLabel: React.ReactNode;
  obligationsLabel: React.ReactNode;
  remainingLiquidityLabel: React.ReactNode;
  formatValue?: (value: number) => React.ReactNode;
  className?: string;
  emptyState?: React.ReactNode;
};

function getCashflowScale(items: MiniCashflowBarItem[]): number {
  const maxValue = items.reduce((currentMax, item) => {
    const values = [item.income, item.expenses, item.obligations, Math.abs(item.remainingLiquidity)];
    return Math.max(currentMax, ...values.filter((value) => Number.isFinite(value)));
  }, 0);

  return maxValue > 0 ? maxValue : 1;
}

function getBarWidth(value: number, scale: number): number {
  if (!Number.isFinite(value) || scale <= 0) {
    return 0;
  }

  return clampPercent((Math.max(value, 0) / scale) * 100);
}

export function MiniCashflowBars({
  items,
  incomeLabel,
  expensesLabel,
  obligationsLabel,
  remainingLiquidityLabel,
  formatValue = (value) => value.toLocaleString(),
  className,
  emptyState,
}: MiniCashflowBarsProps) {
  if (items.length === 0) {
    return emptyState ? <div className={cn("text-sm text-muted-foreground", className)}>{emptyState}</div> : null;
  }

  const scale = getCashflowScale(items);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const remainingTone =
          item.remainingLiquidity > 0
            ? "text-emerald-700 dark:text-emerald-300"
            : item.remainingLiquidity < 0
              ? "text-destructive"
              : "text-muted-foreground";

        return (
          <div
            key={item.id}
            className="group space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="break-words font-medium leading-6">{item.label}</p>
                <p className={cn("text-xs leading-6", remainingTone)}>
                  {remainingLiquidityLabel}:{" "}
                  <span className="tabular-nums">{formatValue(item.remainingLiquidity)}</span>
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs text-muted-foreground">
                  {incomeLabel}: <span className="tabular-nums">{formatValue(item.income)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {expensesLabel}: <span className="tabular-nums">{formatValue(item.expenses)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {obligationsLabel}: <span className="tabular-nums">{formatValue(item.obligations)}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <BarRow label={incomeLabel} value={item.income} scale={scale} tone="bg-primary" />
              <BarRow label={expensesLabel} value={item.expenses} scale={scale} tone="bg-amber-500" />
              <BarRow label={obligationsLabel} value={item.obligations} scale={scale} tone="bg-slate-400 dark:bg-slate-500" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type BarRowProps = {
  label: React.ReactNode;
  value: number;
  scale: number;
  tone: string;
};

function BarRow({ label, value, scale, tone }: BarRowProps) {
  const width = getBarWidth(value, scale);

  return (
    <div className="grid grid-cols-[minmax(0,5.75rem)_minmax(0,1fr)_auto] items-start gap-2 text-xs sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
      <span className="min-w-0 break-words leading-5 text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none",
            tone
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="tabular-nums text-muted-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

type ProgressBarListItem = {
  id: string;
  label: React.ReactNode;
  remainingAmount: React.ReactNode;
  paidPercentage: number | null;
  meta?: React.ReactNode;
};

export type ProgressBarListProps = {
  items: ProgressBarListItem[];
  paidLabel: React.ReactNode;
  remainingLabel: React.ReactNode;
  className?: string;
  emptyState?: React.ReactNode;
};

export function ProgressBarList({
  items,
  paidLabel,
  remainingLabel,
  className,
  emptyState,
}: ProgressBarListProps) {
  if (items.length === 0) {
    return emptyState ? <div className={cn("text-sm text-muted-foreground", className)}>{emptyState}</div> : null;
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const width = clampPercent(item.paidPercentage ?? 0);

        return (
          <li
            key={item.id}
            className="group space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="break-words font-medium leading-6">{item.label}</p>
                {item.meta ? (
                  <p className="text-xs leading-6 text-muted-foreground">{item.meta}</p>
                ) : null}
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs text-muted-foreground">{remainingLabel}</p>
                <p className="text-base font-semibold tabular-nums leading-6">{item.remainingAmount}</p>
                <p className="text-xs text-muted-foreground">
                  {paidLabel}: <span className="tabular-nums">{Math.round(width)}%</span>
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
