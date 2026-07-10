import {
  BadgeDollarSign,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  CollapsibleSection,
  HorizontalBarList,
  EmptyState,
  MetricCard,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  MiniCashflowBars,
  StatusChip,
  ProgressBarList,
  Button,
} from "@/shared/ui";
import {
  calculateFinanceReview,
  calculateLastMonthsFinanceSeries,
  formatFinanceMonthLabel,
  formatFinanceAmount,
  getActiveFinanceObligations,
  getRecentFinanceTransactions,
} from "../financeCalculations";
import { FinanceObligationCard } from "../components/FinanceObligationCard";
import { FinanceObligationForm } from "../components/FinanceObligationForm";
import { FinanceTransactionCard } from "../components/FinanceTransactionCard";
import { FinanceTransactionForm } from "../components/FinanceTransactionForm";
import {
  FINANCE_SECTION_ANCHORS,
  financeQuickNavItems,
  getDefaultFinanceCollapsedSectionIds,
  readStoredFinanceCollapsedSectionIds,
  type FinanceCollapsibleSectionId,
  writeStoredFinanceCollapsedSectionIds,
} from "../financeSections";
import { getFinanceTransactionCategoryLabelKey } from "../domain/finance";
import { useFinance } from "../hooks/useFinance";
import type {
  FinanceObligation,
  FinanceTransaction,
} from "@/shared/types";

type FinanceViewFilter =
  | "all"
  | "income"
  | "expenses"
  | "activeObligations"
  | "paidObligations";

const FINANCE_VIEW_FILTERS: Array<{
  value: FinanceViewFilter;
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "finance.filterAllTransactions" },
  { value: "income", labelKey: "finance.filterIncomeTransactions" },
  { value: "expenses", labelKey: "finance.filterExpenseTransactions" },
  { value: "activeObligations", labelKey: "finance.filterActiveObligations" },
  { value: "paidObligations", labelKey: "finance.filterPaidObligations" },
];

function getBudgetGuardTone(status: "calm" | "watch" | "pressure") {
  switch (status) {
    case "watch":
      return "warning";
    case "pressure":
      return "danger";
    case "calm":
    default:
      return "success";
  }
}

function getBudgetGuardLabelKey(status: "calm" | "watch" | "pressure") {
  switch (status) {
    case "watch":
      return "finance.guardWatch";
    case "pressure":
      return "finance.guardPressure";
    case "calm":
    default:
      return "finance.guardCalm";
  }
}

function getBudgetGuardSummaryKey(status: "calm" | "watch" | "pressure") {
  switch (status) {
    case "watch":
      return "finance.guardWatchSummary";
    case "pressure":
      return "finance.guardPressureSummary";
    case "calm":
    default:
      return "finance.guardCalmSummary";
  }
}

function getFinanceSectionTitleKey(filter: FinanceViewFilter) {
  switch (filter) {
    case "income":
      return "finance.incomeTransactions";
    case "expenses":
      return "finance.expenseTransactions";
    case "activeObligations":
      return "finance.activeObligations";
    case "paidObligations":
      return "finance.paidObligations";
    case "all":
    default:
      return "finance.allTransactions";
  }
}

function getFinanceSectionDescriptionKey(filter: FinanceViewFilter) {
  switch (filter) {
    case "income":
      return "finance.incomeTransactionsDescription";
    case "expenses":
      return "finance.expenseTransactionsDescription";
    case "activeObligations":
      return "finance.activeObligationsDescription";
    case "paidObligations":
      return "finance.paidObligationsDescription";
    case "all":
    default:
      return "finance.allTransactionsDescription";
  }
}

export function FinancePage() {
  const { language, t } = useI18n();
  const { formatDate, resolvedCalendar } = useDateFormatter();
  const referenceDate = useMemo(() => new Date(), []);
  const {
    transactions,
    obligations,
    isLoading,
    error,
    loadFinance,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createObligation,
    updateObligation,
    deleteObligation,
  } = useFinance();
  const [transactionBusyId, setTransactionBusyId] = useState<string | null>(null);
  const [obligationBusyId, setObligationBusyId] = useState<string | null>(null);
  const [isTransactionSubmitting, setIsTransactionSubmitting] = useState(false);
  const [isObligationSubmitting, setIsObligationSubmitting] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [obligationError, setObligationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] =
    useState<FinanceViewFilter>("all");
  const [editingTransaction, setEditingTransaction] = useState<
    FinanceTransaction | undefined
  >();
  const [editingObligation, setEditingObligation] = useState<
    FinanceObligation | undefined
  >();
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<
    FinanceCollapsibleSectionId[]
  >(() => {
    const storedSectionIds = readStoredFinanceCollapsedSectionIds();
    if (storedSectionIds !== null) {
      return storedSectionIds;
    }

    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    return getDefaultFinanceCollapsedSectionIds(isMobile);
  });

  useEffect(() => {
    writeStoredFinanceCollapsedSectionIds(collapsedSectionIds);
  }, [collapsedSectionIds]);

  const currencyLocale = language === "fa" ? "fa-IR" : "en-US";
  const calendarLocale = resolvedCalendar === "jalali" ? "persian" : "gregory";
  const formatAmount = useMemo(
    () => (value: number) =>
      `${formatFinanceAmount(value, currencyLocale)} ${t("finance.currency")}`,
    [currencyLocale, t]
  );

  const review = useMemo(
    () => calculateFinanceReview(transactions, obligations, referenceDate),
    [obligations, referenceDate, transactions]
  );
  const monthlyCashflowSeries = useMemo(
    () => calculateLastMonthsFinanceSeries(transactions, obligations, referenceDate),
    [obligations, referenceDate, transactions]
  );
  const obligationProgressChartData = useMemo(
    () =>
      review.obligationProgress.filter(
        ({ obligation }) => obligation.status !== "paid"
      ),
    [review.obligationProgress]
  );
  const expenseCategoryChartItems = useMemo(
    () =>
      review.expenseCategoryBreakdown.map((item) => ({
        id: item.category,
        label: t(getFinanceTransactionCategoryLabelKey(item.category)),
        amount: formatAmount(item.amount),
        percent: item.percentageOfExpenses,
        meta: t("finance.chartCategoryMeta", {
          count: item.transactionCount,
        }),
      })),
    [formatAmount, review.expenseCategoryBreakdown, t]
  );
  const monthlyCashflowChartItems = useMemo(
    () =>
      monthlyCashflowSeries.map((item) => ({
        id: item.monthKey,
        label: formatFinanceMonthLabel(
          item.monthStart,
          currencyLocale,
          calendarLocale
        ),
        income: item.income,
        expenses: item.expenses,
        obligations: item.obligations,
        remainingLiquidity: item.remainingLiquidity,
      })),
    [calendarLocale, currencyLocale, monthlyCashflowSeries]
  );
  const obligationProgressChartItems = useMemo(
    () =>
      obligationProgressChartData.map((item) => ({
        id: item.obligation.id,
        label: item.obligation.title,
        remainingAmount: formatAmount(item.remainingAmount),
        paidPercentage: item.paidPercentage,
        meta: t(
          item.obligation.status === "paused"
            ? "finance.statusPaused"
            : "finance.statusActive"
        ),
      })),
    [formatAmount, obligationProgressChartData, t]
  );
  const summary = review.summary;
  const sortedTransactions = useMemo(
    () => getRecentFinanceTransactions(transactions, transactions.length),
    [transactions]
  );
  const incomeTransactions = useMemo(
    () => sortedTransactions.filter((transaction) => transaction.type === "income"),
    [sortedTransactions]
  );
  const expenseTransactions = useMemo(
    () => sortedTransactions.filter((transaction) => transaction.type === "expense"),
    [sortedTransactions]
  );
  const activeObligations = useMemo(
    () => getActiveFinanceObligations(obligations),
    [obligations]
  );
  const paidObligations = useMemo(
    () =>
      review.obligationProgress
        .filter(({ obligation }) => obligation.status === "paid")
        .map(({ obligation }) => obligation),
    [review.obligationProgress]
  );
  const budgetGuard = review.budgetGuard;

  type SummaryCard = {
    icon: ReactNode;
    label: string;
    value: string;
    description: string;
    status?: ReactNode;
  };

  const clearMessages = () => {
    setTransactionError(null);
    setObligationError(null);
    setSuccessMessage(null);
  };

  const runTransactionAction = async (
    transaction: FinanceTransaction,
    action: () => Promise<void>,
    busySetter: (value: string | null) => void,
    setError: (value: string | null) => void
  ) => {
    busySetter(transaction.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await action();
      setSuccessMessage(t("finance.savedSuccessfully"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("finance.storageError"));
    } finally {
      busySetter(null);
    }
  };

  const runObligationAction = async (
    obligation: FinanceObligation,
    action: () => Promise<void>,
    busySetter: (value: string | null) => void,
    setError: (value: string | null) => void
  ) => {
    busySetter(obligation.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await action();
      setSuccessMessage(t("finance.savedSuccessfully"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("finance.storageError"));
    } finally {
      busySetter(null);
    }
  };

  const handleTransactionSubmit = async (
    values: Parameters<typeof createTransaction>[0]
  ) => {
    clearMessages();
    setIsTransactionSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, values);
        setSuccessMessage(t("finance.transactionUpdated"));
      } else {
        await createTransaction(values);
        setSuccessMessage(t("finance.transactionCreated"));
      }
      setEditingTransaction(undefined);
    } catch (caught) {
      setTransactionError(caught instanceof Error ? caught.message : t("finance.storageError"));
    } finally {
      setIsTransactionSubmitting(false);
    }
  };

  const handleObligationSubmit = async (
    values: Parameters<typeof createObligation>[0]
  ) => {
    clearMessages();
    setIsObligationSubmitting(true);
    try {
      if (editingObligation) {
        await updateObligation(editingObligation.id, values);
        setSuccessMessage(t("finance.obligationUpdated"));
      } else {
        await createObligation(values);
        setSuccessMessage(t("finance.obligationCreated"));
      }
      setEditingObligation(undefined);
    } catch (caught) {
      setObligationError(caught instanceof Error ? caught.message : t("finance.storageError"));
    } finally {
      setIsObligationSubmitting(false);
    }
  };

  const summaryCards: SummaryCard[] = [
    {
      icon: <CircleDollarSign className="h-5 w-5" />,
      label: t("finance.incomeThisMonth"),
      value: formatAmount(summary.incomeThisMonth),
      description: t("finance.thisMonthSummaryNote"),
    },
    {
      icon: <BadgeDollarSign className="h-5 w-5" />,
      label: t("finance.expensesThisMonth"),
      value: formatAmount(summary.expensesThisMonth),
      description: t("finance.thisMonthSummaryNote"),
    },
    {
      icon: <ReceiptText className="h-5 w-5" />,
      label: t("finance.obligationEstimateThisMonth"),
      value: formatAmount(summary.monthlyObligationsEstimate),
      description: t("finance.thisMonthSummaryNote"),
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      label: t("finance.remainingLiquidity"),
      value: formatAmount(summary.remainingLiquidity),
      description: t("finance.localSummaryNote"),
      status: (
        <StatusChip tone={summary.remainingLiquidity >= 0 ? "success" : "danger"}>
          {summary.remainingLiquidity >= 0
            ? t("finance.liquidityPositive")
            : t("finance.liquidityNegative")}
        </StatusChip>
      ),
    },
  ] as const;

  const filterCounts: Record<FinanceViewFilter, number> = {
    all: transactions.length,
    income: incomeTransactions.length,
    expenses: expenseTransactions.length,
    activeObligations: activeObligations.length,
    paidObligations: paidObligations.length,
  };

  const showTransactionSection =
    selectedFilter === "all" ||
    selectedFilter === "income" ||
    selectedFilter === "expenses";
  const showObligationSection =
    selectedFilter === "all" ||
    selectedFilter === "activeObligations" ||
    selectedFilter === "paidObligations";
  const filteredTransactions =
    selectedFilter === "income"
      ? incomeTransactions
      : selectedFilter === "expenses"
        ? expenseTransactions
        : sortedTransactions;
  const filteredObligations =
    selectedFilter === "paidObligations" ? paidObligations : activeObligations;
  const hasRecords = transactions.length > 0 || obligations.length > 0;
  const transactionSectionTitleKey = getFinanceSectionTitleKey(selectedFilter);
  const transactionSectionDescriptionKey =
    getFinanceSectionDescriptionKey(selectedFilter);
  const obligationSectionTitleKey =
    selectedFilter === "paidObligations"
      ? "finance.paidObligations"
      : "finance.activeObligations";
  const obligationSectionDescriptionKey =
    selectedFilter === "paidObligations"
      ? "finance.paidObligationsDescription"
      : "finance.activeObligationsDescription";
  const isCollapsedSection = (sectionId: FinanceCollapsibleSectionId) =>
    collapsedSectionIds.includes(sectionId);
  const setCollapsedSectionOpen = (
    sectionId: FinanceCollapsibleSectionId,
    open: boolean
  ) => {
    setCollapsedSectionIds((currentValue) => {
      if (open) {
        return currentValue.filter((value) => value !== sectionId);
      }

      return currentValue.includes(sectionId)
        ? currentValue
        : [...currentValue, sectionId];
    });
  };
  const scrollToSection = (anchorId: string) => {
    const element = document.getElementById(anchorId);

    if (!element) {
      return;
    }

    const behavior =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

    window.requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior,
        block: "start",
      });
    });
  };
  const handleQuickNav = (anchorId: string) => {
    if (anchorId === FINANCE_SECTION_ANCHORS.charts) {
      setCollapsedSectionOpen("charts", true);
    } else if (anchorId === FINANCE_SECTION_ANCHORS.review) {
      setCollapsedSectionOpen("review", true);
    } else if (anchorId === FINANCE_SECTION_ANCHORS.obligations) {
      setCollapsedSectionOpen("obligations", true);
    } else if (anchorId === FINANCE_SECTION_ANCHORS.transactions) {
      setCollapsedSectionOpen("transactions", true);
    }

    window.setTimeout(() => {
      scrollToSection(anchorId);
    }, 0);
  };

  return (
    <section className="alios-page space-y-6">
      <section id={FINANCE_SECTION_ANCHORS.summary} className="scroll-mt-32 space-y-4">
        <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
          <div className="p-5 sm:p-6">
            <SectionHeader
              icon={<Landmark className="h-5 w-5" />}
              eyebrow={t("finance.title")}
              title={t("finance.title")}
              description={t("finance.description")}
              status={
                <StatusChip tone="neutral">{t("finance.localSummaryNote")}</StatusChip>
              }
            />
            <div className="mt-4 max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
              <p>{t("finance.reviewIntro")}</p>
              <p>{t("finance.reviewLiquidityExplanation")}</p>
              <p>{t("finance.noAdviceNote")}</p>
            </div>
          </div>
        </PremiumCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <MetricCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              description={card.description}
              status={card.status}
            />
          ))}
        </div>
      </section>

      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-20 rounded-3xl border border-border/70 bg-background/95 px-3 py-2 backdrop-blur-xl sm:px-4 md:top-20">
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={t("finance.quickNavigation")}>
          {financeQuickNavItems.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="outline"
              className="shrink-0 rounded-full px-4 py-2 text-start text-xs leading-5 whitespace-normal sm:text-sm"
              onClick={() => handleQuickNav(item.anchorId)}
            >
              {t(item.labelKey)}
            </Button>
          ))}
        </nav>
      </div>

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          {successMessage}
        </div>
      ) : null}

      {error || transactionError || obligationError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{transactionError ?? obligationError ?? error}</span>
          </div>
          {error ? (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium"
              onClick={() => void loadFinance()}
            >
              <RotateCcw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </button>
          ) : null}
        </div>
      ) : null}

      <CollapsibleSection
        id={FINANCE_SECTION_ANCHORS.charts}
        title={t("finance.sectionCharts")}
        description={t("finance.chartsDescription")}
      status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
      open={!isCollapsedSection("charts")}
      onOpenChange={(open) => setCollapsedSectionOpen("charts", open)}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="scroll-mt-32"
      contentClassName="space-y-4"
    >
        <div className="grid gap-4 xl:grid-cols-3">
          <SoftPanel className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {t("finance.monthlySpendingByCategory")}
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("finance.basedOnEnteredData")}
              </p>
            </div>
            {expenseCategoryChartItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-6 text-sm leading-7 text-muted-foreground">
                {t("finance.noChartDataEmptyState")}
              </div>
            ) : (
              <HorizontalBarList
                aria-label={t("finance.monthlySpendingByCategory")}
                items={expenseCategoryChartItems}
              />
            )}
          </SoftPanel>

          <SoftPanel className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{t("finance.monthlyCashflowChart")}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("finance.basedOnEnteredData")}
              </p>
            </div>
            {monthlyCashflowSeries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-6 text-sm leading-7 text-muted-foreground">
                {t("finance.notEnoughData")}
              </div>
            ) : (
              <MiniCashflowBars
                incomeLabel={t("finance.chartIncome")}
                expensesLabel={t("finance.chartExpenses")}
                obligationsLabel={t("finance.chartObligations")}
                remainingLiquidityLabel={t("finance.chartRemainingLiquidity")}
                formatValue={(value) => formatFinanceAmount(value, currencyLocale)}
                items={monthlyCashflowChartItems}
              />
            )}
          </SoftPanel>

          <SoftPanel className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {t("finance.obligationProgressChart")}
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("finance.basedOnEnteredData")}
              </p>
            </div>
            {obligationProgressChartData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-6 text-sm leading-7 text-muted-foreground">
                {t("finance.noChartDataEmptyState")}
              </div>
            ) : (
              <ProgressBarList
                paidLabel={t("finance.paidProgress")}
                remainingLabel={t("finance.remainingAmount")}
                items={obligationProgressChartItems}
              />
            )}
          </SoftPanel>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id={FINANCE_SECTION_ANCHORS.review}
        title={t("finance.sectionReview")}
        description={t("finance.reviewIntro")}
        status={
          <StatusChip tone={getBudgetGuardTone(budgetGuard.status)}>
            {t(getBudgetGuardLabelKey(budgetGuard.status))}
          </StatusChip>
        }
        open={!isCollapsedSection("review")}
        onOpenChange={(open) => setCollapsedSectionOpen("review", open)}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="scroll-mt-32"
        contentClassName="space-y-4"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SoftPanel className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {t("finance.monthlySpendingByCategory")}
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("finance.monthlySpendingByCategoryDescription")}
              </p>
            </div>
            <div className="space-y-3">
              {review.expenseCategoryBreakdown.length === 0 ? (
                <SoftPanel>
                  <p className="text-sm text-muted-foreground">
                    {t("finance.noMonthlyExpensesYet")}
                  </p>
                </SoftPanel>
              ) : (
                review.expenseCategoryBreakdown.map((item) => (
                  <SoftPanel
                    key={item.category}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">
                          {t(getFinanceTransactionCategoryLabelKey(item.category))}
                        </h3>
                        <StatusChip tone="neutral">{item.transactionCount}</StatusChip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("finance.monthlySpendingShare")}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-base font-semibold tabular-nums">
                        {formatAmount(item.amount)}
                      </p>
                      <StatusChip tone="neutral">
                        {Math.round(item.percentageOfExpenses)}%
                      </StatusChip>
                    </div>
                  </SoftPanel>
                ))
              )}
            </div>
          </SoftPanel>

          <SoftPanel className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{t("finance.budgetGuard")}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("finance.budgetGuardDescription")}
              </p>
            </div>
            <div className="space-y-4">
              <SoftPanel className="space-y-3">
                <p className="text-sm leading-7">
                  {t(getBudgetGuardSummaryKey(budgetGuard.status))}
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("finance.budgetGuardNote")}
                </p>
              </SoftPanel>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-background/70 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {t("finance.incomeThisMonth")}
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {formatAmount(budgetGuard.incomeThisMonth)}
                  </p>
                </div>
                <div className="rounded-2xl border bg-background/70 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {t("finance.budgetGuardPressure")}
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums">
                    {formatAmount(
                      budgetGuard.expensesThisMonth +
                        budgetGuard.monthlyObligationsEstimate
                    )}
                  </p>
                </div>
              </div>
            </div>
          </SoftPanel>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id={FINANCE_SECTION_ANCHORS.obligations}
        title={t("finance.sectionObligations")}
        description={t("finance.upcomingObligationPressureDescription")}
        status={
          <StatusChip tone="neutral">{review.upcomingObligations.length}</StatusChip>
        }
        open={!isCollapsedSection("obligations")}
        onOpenChange={(open) => setCollapsedSectionOpen("obligations", open)}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="scroll-mt-32"
        contentClassName="space-y-4"
      >
        <div className="space-y-3">
          {review.upcomingObligations.length === 0 ? (
            <SoftPanel>
              <p className="text-sm text-muted-foreground">
                {t("finance.noUpcomingObligationsYet")}
              </p>
            </SoftPanel>
          ) : (
            review.upcomingObligations.map((item) => (
              <SoftPanel key={item.obligation.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={item.label === "dueSoon" ? "warning" : "neutral"}>
                        {t(
                          item.label === "dueSoon"
                            ? "finance.dueSoon"
                            : item.label === "dueThisMonth"
                              ? "finance.dueThisMonth"
                              : "finance.noDueDate"
                        )}
                      </StatusChip>
                      <StatusChip tone="neutral">
                        {t(
                          item.obligation.type === "installment"
                            ? "finance.obligationTypeInstallment"
                            : "finance.obligationTypeDebt"
                        )}
                      </StatusChip>
                    </div>
                    <h3 className="text-base font-semibold leading-7">
                      {item.obligation.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.nextDueDate ? formatDate(item.nextDueDate) : t("finance.noDueDate")}
                    </p>
                  </div>
                  <p className="text-base font-semibold tabular-nums">
                    {formatAmount(item.remainingAmount)}
                  </p>
                </div>
                {item.paidPercentage !== null ? (
                  <p className="text-xs text-muted-foreground">
                    {t("finance.paidPercentage", {
                      value: Math.round(item.paidPercentage),
                    })}
                  </p>
                ) : null}
              </SoftPanel>
            ))
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id={FINANCE_SECTION_ANCHORS.transactions}
        title={t("finance.sectionTransactions")}
        description={t("finance.recordFiltersDescription")}
        status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
        open={!isCollapsedSection("transactions")}
        onOpenChange={(open) => setCollapsedSectionOpen("transactions", open)}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="scroll-mt-32"
        contentClassName="space-y-4"
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {FINANCE_VIEW_FILTERS.map((option) => {
            const isSelected = selectedFilter === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className="flex w-full items-start justify-between gap-3 text-start"
                onClick={() => setSelectedFilter(option.value)}
              >
                <span className="min-w-0 flex-1 break-words">{t(option.labelKey)}</span>
                <StatusChip tone={isSelected ? "primary" : "neutral"}>
                  {filterCounts[option.value]}
                </StatusChip>
              </Button>
            );
          })}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 xl:grid-cols-2" aria-label={t("finance.loading")}>
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-2xl border bg-muted/60"
                />
              ))}
            </div>
          ) : !hasRecords ? (
            <EmptyState
              icon={<Wallet className="h-6 w-6" />}
              title={t("finance.emptyTitle")}
              description={t("finance.emptyDescription")}
              note={t("finance.emptyNote")}
              actions={
                <>
                  <Button
                    type="button"
                    onClick={() => handleQuickNav(FINANCE_SECTION_ANCHORS.addTransaction)}
                  >
                    {t("finance.addTransaction")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickNav(FINANCE_SECTION_ANCHORS.addObligation)}
                  >
                    {t("finance.addObligation")}
                  </Button>
                </>
              }
            />
          ) : (
            <div className={selectedFilter === "all" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
              {showTransactionSection ? (
                <PremiumCard>
                  <div className="p-5 sm:p-6">
                    <SectionHeader
                      title={t(transactionSectionTitleKey)}
                      description={t(transactionSectionDescriptionKey)}
                      status={
                        <StatusChip tone="neutral">{filteredTransactions.length}</StatusChip>
                      }
                    />
                    <div className="mt-5 space-y-4">
                      {filteredTransactions.length === 0 ? (
                        <SoftPanel className="space-y-3">
                          <p className="text-sm leading-7 text-muted-foreground">
                            {selectedFilter === "income"
                              ? t("finance.noIncomeTransactionsYet")
                              : selectedFilter === "expenses"
                                ? t("finance.noExpenseTransactionsYet")
                                : t("finance.noTransactionsYet")}
                          </p>
                          <p className="text-xs leading-6 text-muted-foreground">
                            {t("finance.transactionsEmptyNote")}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleQuickNav(FINANCE_SECTION_ANCHORS.addTransaction)}
                          >
                            {t("finance.addTransaction")}
                          </Button>
                        </SoftPanel>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <FinanceTransactionCard
                            key={transaction.id}
                            transaction={transaction}
                            isBusy={transactionBusyId === transaction.id}
                            onEdit={() => setEditingTransaction(transaction)}
                            onDelete={() =>
                              runTransactionAction(
                                transaction,
                                () => deleteTransaction(transaction.id),
                                setTransactionBusyId,
                                setTransactionError
                              )
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </PremiumCard>
              ) : null}

              {showObligationSection ? (
                <PremiumCard>
                  <div className="p-5 sm:p-6">
                    <SectionHeader
                      title={t(obligationSectionTitleKey)}
                      description={t(obligationSectionDescriptionKey)}
                      status={
                        selectedFilter === "paidObligations" ? (
                          <StatusChip tone="neutral">{filteredObligations.length}</StatusChip>
                        ) : (
                          <StatusChip tone="neutral">
                            {t("finance.remainingObligationTotal")}:{" "}
                            {formatAmount(summary.totalRemainingObligation)}
                          </StatusChip>
                        )
                      }
                    />
                    <div className="mt-5 space-y-4">
                      {filteredObligations.length === 0 ? (
                        <SoftPanel className="space-y-3">
                          <p className="text-sm leading-7 text-muted-foreground">
                            {selectedFilter === "paidObligations"
                              ? t("finance.noPaidObligationsYet")
                              : t("finance.noObligationsYet")}
                          </p>
                          <p className="text-xs leading-6 text-muted-foreground">
                            {t("finance.obligationsEmptyNote")}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleQuickNav(FINANCE_SECTION_ANCHORS.addObligation)}
                          >
                            {t("finance.addObligation")}
                          </Button>
                        </SoftPanel>
                      ) : (
                        filteredObligations.map((obligation) => (
                          <FinanceObligationCard
                            key={obligation.id}
                            obligation={obligation}
                            isBusy={obligationBusyId === obligation.id}
                            onEdit={() => setEditingObligation(obligation)}
                            onDelete={() =>
                              runObligationAction(
                                obligation,
                                () => deleteObligation(obligation.id),
                                setObligationBusyId,
                                setObligationError
                              )
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </PremiumCard>
              ) : null}
            </div>
          )}
        </div>
      </CollapsibleSection>

      <section id={FINANCE_SECTION_ANCHORS.add} className="scroll-mt-32 space-y-4">
        <PremiumCard>
          <div className="p-5 sm:p-6">
            <SectionHeader
              title={t("finance.sectionAdd")}
              description={t("finance.quickAddDescription")}
              status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
            />
          </div>
        </PremiumCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <CollapsibleSection
            id={FINANCE_SECTION_ANCHORS.addTransaction}
            title={t("finance.addTransaction")}
            description={t("finance.transactionFormDescription")}
            status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
            open={!isCollapsedSection("addTransaction")}
            onOpenChange={(open) => setCollapsedSectionOpen("addTransaction", open)}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            className="h-full"
            contentClassName="space-y-4"
          >
            <FinanceTransactionForm
              key={editingTransaction?.id ?? "finance-transaction-form"}
              transaction={editingTransaction}
              isSubmitting={isTransactionSubmitting}
              onSubmit={handleTransactionSubmit}
              onCancel={
                editingTransaction ? () => setEditingTransaction(undefined) : undefined
              }
            />
          </CollapsibleSection>

          <CollapsibleSection
            id={FINANCE_SECTION_ANCHORS.addObligation}
            title={t("finance.addObligation")}
            description={t("finance.obligationFormDescription")}
            status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
            open={!isCollapsedSection("addObligation")}
            onOpenChange={(open) => setCollapsedSectionOpen("addObligation", open)}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            className="h-full"
            contentClassName="space-y-4"
          >
            <FinanceObligationForm
              key={editingObligation?.id ?? "finance-obligation-form"}
              obligation={editingObligation}
              isSubmitting={isObligationSubmitting}
              onSubmit={handleObligationSubmit}
              onCancel={
                editingObligation ? () => setEditingObligation(undefined) : undefined
              }
            />
          </CollapsibleSection>
        </div>
      </section>
    </section>
  );
}
