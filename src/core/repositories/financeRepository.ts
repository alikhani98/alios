import type {
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
}
