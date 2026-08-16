import { useCallback, useEffect, useState } from "react";

import type {
  CreateFinanceAssetInput,
  CreateFinanceCategoryBudgetInput,
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  UpdateFinanceAssetInput,
  UpdateFinanceCategoryBudgetInput,
  UpdateFinanceObligationInput,
  UpdateFinanceTransactionInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type {
  FinanceAsset,
  FinanceCategoryBudget,
  FinanceObligation,
  FinanceTransaction,
} from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useFinance() {
  const { finance } = useStorageAdapter();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [obligations, setObligations] = useState<FinanceObligation[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<FinanceCategoryBudget[]>(
    []
  );
  const [assets, setAssets] = useState<FinanceAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        loadedTransactions,
        loadedObligations,
        loadedCategoryBudgets,
        loadedAssets,
      ] =
        await Promise.all([
          finance.listTransactions(),
          finance.listObligations(),
          finance.listCategoryBudgets(),
          finance.listAssets(),
        ]);
      setTransactions(loadedTransactions);
      setObligations(loadedObligations);
      setCategoryBudgets(loadedCategoryBudgets);
      setAssets(loadedAssets);
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

  const createCategoryBudget = useCallback(
    async (input: CreateFinanceCategoryBudgetInput) => {
      setError(null);
      const budget = await finance.createCategoryBudget(input);
      setCategoryBudgets((current) => [...current, budget]);
      return budget;
    },
    [finance]
  );

  const updateCategoryBudget = useCallback(
    async (id: string, input: UpdateFinanceCategoryBudgetInput) => {
      setError(null);
      const budget = await finance.updateCategoryBudget(id, input);
      setCategoryBudgets((current) =>
        current.map((item) => (item.id === id ? budget : item))
      );
      return budget;
    },
    [finance]
  );

  const deleteCategoryBudget = useCallback(
    async (id: string) => {
      setError(null);
      await finance.deleteCategoryBudget(id);
      setCategoryBudgets((current) => current.filter((budget) => budget.id !== id));
    },
    [finance]
  );

  const createAsset = useCallback(
    async (input: CreateFinanceAssetInput) => {
      setError(null);
      const asset = await finance.createAsset(input);
      setAssets((current) => [asset, ...current]);
      return asset;
    },
    [finance]
  );

  const updateAsset = useCallback(
    async (id: string, input: UpdateFinanceAssetInput) => {
      setError(null);
      const asset = await finance.updateAsset(id, input);
      setAssets((current) =>
        current.map((item) => (item.id === id ? asset : item))
      );
      return asset;
    },
    [finance]
  );

  const deleteAsset = useCallback(
    async (id: string) => {
      setError(null);
      await finance.deleteAsset(id);
      setAssets((current) => current.filter((asset) => asset.id !== id));
    },
    [finance]
  );

  return {
    transactions,
    obligations,
    categoryBudgets,
    assets,
    isLoading,
    error,
    loadFinance,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createObligation,
    updateObligation,
    deleteObligation,
    createCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}
