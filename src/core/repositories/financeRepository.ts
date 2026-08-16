import type {
  FinanceAsset,
  FinanceCategoryBudget,
  FinanceObligation,
  FinanceTransaction,
} from "@/shared/types";

export type CreateFinanceTransactionInput = Omit<
  FinanceTransaction,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateFinanceTransactionInput = Partial<CreateFinanceTransactionInput>;

export type CreateFinanceObligationInput = Omit<
  FinanceObligation,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateFinanceObligationInput = Partial<CreateFinanceObligationInput>;

export type CreateFinanceCategoryBudgetInput = Omit<
  FinanceCategoryBudget,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateFinanceCategoryBudgetInput =
  Partial<CreateFinanceCategoryBudgetInput>;

export type CreateFinanceAssetInput = Omit<
  FinanceAsset,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateFinanceAssetInput = Partial<CreateFinanceAssetInput>;

export interface FinanceRepository {
  listTransactions(): Promise<FinanceTransaction[]>;
  getTransactionById(id: string): Promise<FinanceTransaction | undefined>;
  createTransaction(
    input: CreateFinanceTransactionInput
  ): Promise<FinanceTransaction>;
  updateTransaction(
    id: string,
    input: UpdateFinanceTransactionInput
  ): Promise<FinanceTransaction>;
  deleteTransaction(id: string): Promise<void>;

  listObligations(): Promise<FinanceObligation[]>;
  getObligationById(id: string): Promise<FinanceObligation | undefined>;
  createObligation(
    input: CreateFinanceObligationInput
  ): Promise<FinanceObligation>;
  updateObligation(
    id: string,
    input: UpdateFinanceObligationInput
  ): Promise<FinanceObligation>;
  deleteObligation(id: string): Promise<void>;

  listCategoryBudgets(): Promise<FinanceCategoryBudget[]>;
  getCategoryBudgetById(id: string): Promise<FinanceCategoryBudget | undefined>;
  createCategoryBudget(
    input: CreateFinanceCategoryBudgetInput
  ): Promise<FinanceCategoryBudget>;
  updateCategoryBudget(
    id: string,
    input: UpdateFinanceCategoryBudgetInput
  ): Promise<FinanceCategoryBudget>;
  deleteCategoryBudget(id: string): Promise<void>;

  listAssets(): Promise<FinanceAsset[]>;
  getAssetById(id: string): Promise<FinanceAsset | undefined>;
  createAsset(input: CreateFinanceAssetInput): Promise<FinanceAsset>;
  updateAsset(
    id: string,
    input: UpdateFinanceAssetInput
  ): Promise<FinanceAsset>;
  deleteAsset(id: string): Promise<void>;
}
