import { BadgeDollarSign, CircleDollarSign, Landmark, ReceiptText, RotateCcw, Wallet } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { useI18n } from "@/shared/i18n";
import {
  EmptyState,
  MetricCard,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import {
  calculateFinanceSummary,
  formatFinanceAmount,
  getActiveFinanceObligations,
  getRecentFinanceTransactions,
} from "../financeCalculations";
import { FinanceObligationCard } from "../components/FinanceObligationCard";
import { FinanceObligationForm } from "../components/FinanceObligationForm";
import { FinanceTransactionCard } from "../components/FinanceTransactionCard";
import { FinanceTransactionForm } from "../components/FinanceTransactionForm";
import { useFinance } from "../hooks/useFinance";
import type {
  FinanceObligation,
  FinanceTransaction,
} from "@/shared/types";

export function FinancePage() {
  const { language, t } = useI18n();
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
  const [editingTransaction, setEditingTransaction] = useState<
    FinanceTransaction | undefined
  >();
  const [editingObligation, setEditingObligation] = useState<
    FinanceObligation | undefined
  >();

  const summary = useMemo(
    () => calculateFinanceSummary(transactions, obligations),
    [obligations, transactions]
  );
  const recentTransactions = useMemo(
    () => getRecentFinanceTransactions(transactions),
    [transactions]
  );
  const activeObligations = useMemo(
    () => getActiveFinanceObligations(obligations),
    [obligations]
  );

  const currencyLocale = language === "fa" ? "fa-IR" : "en-US";
  const formatAmount = (value: number) =>
    `${formatFinanceAmount(value, currencyLocale)} ${t("finance.currency")}`;

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
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            {t("finance.noAdviceNote")}
          </p>
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

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2" aria-label={t("finance.loading")}>
          {[0, 1].map((index) => (
            <div key={index} className="h-80 animate-pulse rounded-2xl border bg-muted/60" />
          ))}
        </div>
      ) : transactions.length === 0 && obligations.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title={t("finance.emptyTitle")}
          description={t("finance.emptyDescription")}
        />
      ) : (
        <div className="space-y-6">
          <PremiumCard>
            <div className="p-5 sm:p-6">
              <SectionHeader
                title={t("finance.recentTransactions")}
                description={t("finance.recentTransactionsDescription")}
                status={<StatusChip tone="neutral">{t("finance.localOnlyData")}</StatusChip>}
              />
              <div className="mt-5 space-y-4">
                {recentTransactions.length === 0 ? (
                  <SoftPanel>
                    <p className="text-sm text-muted-foreground">{t("finance.noTransactionsYet")}</p>
                  </SoftPanel>
                ) : (
                  recentTransactions.map((transaction) => (
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

          <PremiumCard>
            <div className="p-5 sm:p-6">
              <SectionHeader
                title={t("finance.activeObligations")}
                description={t("finance.activeObligationsDescription")}
                status={
                  <StatusChip tone="neutral">
                    {t("finance.remainingObligationTotal")}: {formatAmount(summary.totalRemainingObligation)}
                  </StatusChip>
                }
              />
              <div className="mt-5 space-y-4">
                {activeObligations.length === 0 ? (
                  <SoftPanel>
                    <p className="text-sm text-muted-foreground">{t("finance.noObligationsYet")}</p>
                  </SoftPanel>
                ) : (
                  activeObligations.map((obligation) => (
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
        </div>
      )}

    </section>
  );
}
