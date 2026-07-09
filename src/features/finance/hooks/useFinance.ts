import { useCallback, useEffect, useState } from "react";

import type {
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  UpdateFinanceObligationInput,
  UpdateFinanceTransactionInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { FinanceObligation, FinanceTransaction } from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useFinance() {
  const { finance } = useStorageAdapter();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [obligations, setObligations] = useState<FinanceObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [loadedTransactions, loadedObligations] = await Promise.all([
        finance.listTransactions(),
        finance.listObligations(),
      ]);
      setTransactions(loadedTransactions);
      setObligations(loadedObligations);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [finance]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const createTransaction = useCallback(
    async (input: CreateFinanceTransactionInput) => {
      setError(null);
      const transaction = await finance.createTransaction(input);
      setTransactions((current) => [...current, transaction]);
      return transaction;
    },
    [finance]
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateFinanceTransactionInput) => {
      setError(null);
      const transaction = await finance.updateTransaction(id, input);
      setTransactions((current) =>
        current.map((item) => (item.id === id ? transaction : item))
      );
      return transaction;
    },
    [finance]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setError(null);
      await finance.deleteTransaction(id);
      setTransactions((current) =>
        current.filter((transaction) => transaction.id !== id)
      );
    },
    [finance]
  );

  const createObligation = useCallback(
    async (input: CreateFinanceObligationInput) => {
      setError(null);
      const obligation = await finance.createObligation(input);
      setObligations((current) => [...current, obligation]);
      return obligation;
    },
    [finance]
  );

  const updateObligation = useCallback(
    async (id: string, input: UpdateFinanceObligationInput) => {
      setError(null);
      const obligation = await finance.updateObligation(id, input);
      setObligations((current) =>
        current.map((item) => (item.id === id ? obligation : item))
      );
      return obligation;
    },
    [finance]
  );

  const deleteObligation = useCallback(
    async (id: string) => {
      setError(null);
      await finance.deleteObligation(id);
      setObligations((current) =>
        current.filter((obligation) => obligation.id !== id)
      );
    },
    [finance]
  );

  return {
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
  };
}
