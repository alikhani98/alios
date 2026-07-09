import {
  BadgeDollarSign,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  EmptyState,
  MetricCard,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
  Button,
} from "@/shared/ui";
import {
  calculateFinanceReview,
  formatFinanceAmount,
  getActiveFinanceObligations,
  getRecentFinanceTransactions,
} from "../financeCalculations";
import { FinanceObligationCard } from "../components/FinanceObligationCard";
import { FinanceObligationForm } from "../components/FinanceObligationForm";
import { FinanceTransactionCard } from "../components/FinanceTransactionCard";
import { FinanceTransactionForm } from "../components/FinanceTransactionForm";
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
  const { formatDate } = useDateFormatter();
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

  const review = useMemo(
    () => calculateFinanceReview(transactions, obligations),
    [obligations, transactions]
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

  const currencyLocale = language === "fa" ? "fa-IR" : "en-US";
  const formatAmount = (value: number) =>
    `${formatFinanceAmount(value, currencyLocale)} ${t("finance.currency")}`;
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

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <div className="p-5 sm:p-6">
          <SectionHeader
            icon={<Landmark className="h-5 w-5" />}
            eyebrow={t("finance.title")}
            title={t("finance.title")}
            description={t("finance.description")}
            status={<StatusChip tone="neutral">{t("finance.localSummaryNote")}</StatusChip>}
          />
          <div className="mt-4 max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
            <p>{t("finance.reviewIntro")}</p>
            <p>{t("finance.reviewLiquidityExplanation")}</p>
            <p>{t("finance.noAdviceNote")}</p>
          </div>
        </div>
      </PremiumCard>

      {successMessage ? (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
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

      <div className="grid gap-4 xl:grid-cols-3">
        <PremiumCard>
          <div className="p-5 sm:p-6">
            <SectionHeader
              title={t("finance.monthlySpendingByCategory")}
              description={t("finance.monthlySpendingByCategoryDescription")}
              status={<StatusChip tone="neutral">{review.expenseCategoryBreakdown.length}</StatusChip>}
            />
            <div className="mt-5 space-y-3">
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
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="p-5 sm:p-6">
            <SectionHeader
              title={t("finance.budgetGuard")}
              description={t("finance.budgetGuardDescription")}
              status={
                <StatusChip tone={getBudgetGuardTone(budgetGuard.status)}>
                  {t(getBudgetGuardLabelKey(budgetGuard.status))}
                </StatusChip>
              }
            />
            <div className="mt-5 space-y-4">
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
                  <p className="text-xs text-muted-foreground">{t("finance.incomeThisMonth")}</p>
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
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="p-5 sm:p-6">
            <SectionHeader
              title={t("finance.upcomingObligationPressure")}
              description={t("finance.upcomingObligationPressureDescription")}
              status={<StatusChip tone="neutral">{review.upcomingObligations.length}</StatusChip>}
            />
            <div className="mt-5 space-y-3">
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
                          <StatusChip
                            tone={item.label === "dueSoon" ? "warning" : "neutral"}
                          >
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
          </div>
        </PremiumCard>
      </div>

      <PremiumCard>
        <div className="p-5 sm:p-6">
          <SectionHeader
            title={t("finance.quickAdd")}
            description={t("finance.quickAddDescription")}
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <SoftPanel className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{t("finance.addTransaction")}</p>
                <p className="text-sm text-muted-foreground">{t("finance.transactionFormDescription")}</p>
              </div>
              <FinanceTransactionForm
                key={editingTransaction?.id ?? "finance-transaction-form"}
                transaction={editingTransaction}
                isSubmitting={isTransactionSubmitting}
                onSubmit={handleTransactionSubmit}
                onCancel={
                  editingTransaction ? () => setEditingTransaction(undefined) : undefined
                }
              />
            </SoftPanel>

            <SoftPanel className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{t("finance.addObligation")}</p>
                <p className="text-sm text-muted-foreground">{t("finance.obligationFormDescription")}</p>
              </div>
              <FinanceObligationForm
                key={editingObligation?.id ?? "finance-obligation-form"}
                obligation={editingObligation}
                isSubmitting={isObligationSubmitting}
                onSubmit={handleObligationSubmit}
                onCancel={
                  editingObligation ? () => setEditingObligation(undefined) : undefined
                }
              />
            </SoftPanel>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="p-5 sm:p-6">
          <SectionHeader
            title={t("finance.recordFilters")}
            description={t("finance.recordFiltersDescription")}
            status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
          />
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {FINANCE_VIEW_FILTERS.map((option) => {
              const isSelected = selectedFilter === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="flex items-center justify-between gap-3"
                  onClick={() => setSelectedFilter(option.value)}
                >
                  <span>{t(option.labelKey)}</span>
                  <StatusChip tone={isSelected ? "primary" : "neutral"}>
                    {filterCounts[option.value]}
                  </StatusChip>
                </Button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="grid gap-4 xl:grid-cols-2" aria-label={t("finance.loading")}>
                {[0, 1].map((index) => (
                  <div key={index} className="h-80 animate-pulse rounded-2xl border bg-muted/60" />
                ))}
              </div>
            ) : !hasRecords ? (
              <EmptyState
                icon={<Wallet className="h-6 w-6" />}
                title={t("finance.emptyTitle")}
                description={t("finance.emptyDescription")}
              />
            ) : (
              <div className={selectedFilter === "all" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
                {showTransactionSection ? (
                  <PremiumCard>
                    <div className="p-5 sm:p-6">
                      <SectionHeader
                        title={t(transactionSectionTitleKey)}
                        description={t(transactionSectionDescriptionKey)}
                        status={<StatusChip tone="neutral">{filteredTransactions.length}</StatusChip>}
                      />
                      <div className="mt-5 space-y-4">
                        {filteredTransactions.length === 0 ? (
                          <SoftPanel>
                            <p className="text-sm text-muted-foreground">
                              {selectedFilter === "income"
                                ? t("finance.noIncomeTransactionsYet")
                                : selectedFilter === "expenses"
                                  ? t("finance.noExpenseTransactionsYet")
                                  : t("finance.noTransactionsYet")}
                            </p>
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
                              {t("finance.remainingObligationTotal")}: {formatAmount(summary.totalRemainingObligation)}
                            </StatusChip>
                          )
                        }
                      />
                      <div className="mt-5 space-y-4">
                        {filteredObligations.length === 0 ? (
                          <SoftPanel>
                            <p className="text-sm text-muted-foreground">
                              {selectedFilter === "paidObligations"
                                ? t("finance.noPaidObligationsYet")
                                : t("finance.noObligationsYet")}
                            </p>
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
        </div>
      </PremiumCard>

    </section>
  );
}
