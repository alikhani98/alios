import type {
  CreateFinanceCategoryBudgetInput,
  CreateFinanceAssetInput,
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  FinanceRepository,
  UpdateFinanceCategoryBudgetInput,
  UpdateFinanceAssetInput,
  UpdateFinanceObligationInput,
  UpdateFinanceTransactionInput,
} from "@/core/repositories";
import {
  financeAssetSchema,
  financeCategoryBudgetSchema,
  financeObligationSchema,
  financeTransactionSchema,
  type FinanceAsset,
  type FinanceCategoryBudget,
  type FinanceObligation,
  type FinanceTransaction,
} from "@/shared/types";
import { notifyUserDataSyncTrigger } from "@/core/sync";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieFinanceRepository
  extends DexieRepositoryBase
  implements FinanceRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async listTransactions(): Promise<FinanceTransaction[]> {
    return this.execute("listing finance transactions", async () => {
      const records = await this.database.financeTransactions.toArray();
      return records.map((record) => financeTransactionSchema.parse(record));
    });
  }

  async getTransactionById(id: string): Promise<FinanceTransaction | undefined> {
    return this.execute("reading a finance transaction", async () => {
      const record = await this.database.financeTransactions.get(id);
      return record === undefined
        ? undefined
        : financeTransactionSchema.parse(record);
    });
  }

  async createTransaction(
    input: CreateFinanceTransactionInput
  ): Promise<FinanceTransaction> {
    return this.execute("creating a finance transaction", async () => {
      const transaction = financeTransactionSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.financeTransactions.add(transaction);
      notifyUserDataSyncTrigger({
        entity: "financeTransactions",
        operation: "create",
      });
      return transaction;
    });
  }

  async updateTransaction(
    id: string,
    input: UpdateFinanceTransactionInput
  ): Promise<FinanceTransaction> {
    return this.execute("updating a finance transaction", () =>
      this.database.transaction("rw", this.database.financeTransactions, async () => {
        const current = this.requireEntity(
          "Finance transaction",
          id,
          await this.database.financeTransactions.get(id)
        );
        const transaction = financeTransactionSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.financeTransactions.put(transaction);
        notifyUserDataSyncTrigger({
          entity: "financeTransactions",
          operation: "update",
        });
        return transaction;
      })
    );
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.execute("deleting a finance transaction", () =>
      this.database.transaction("rw", this.database.financeTransactions, async () => {
        this.requireEntity(
          "Finance transaction",
          id,
          await this.database.financeTransactions.get(id)
        );
        await this.database.financeTransactions.delete(id);
        notifyUserDataSyncTrigger({
          entity: "financeTransactions",
          operation: "delete",
        });
      })
    );
  }

  async listObligations(): Promise<FinanceObligation[]> {
    return this.execute("listing finance obligations", async () => {
      const records = await this.database.financeObligations.toArray();
      return records.map((record) => financeObligationSchema.parse(record));
    });
  }

  async getObligationById(id: string): Promise<FinanceObligation | undefined> {
    return this.execute("reading a finance obligation", async () => {
      const record = await this.database.financeObligations.get(id);
      return record === undefined
        ? undefined
        : financeObligationSchema.parse(record);
    });
  }

  async createObligation(
    input: CreateFinanceObligationInput
  ): Promise<FinanceObligation> {
    return this.execute("creating a finance obligation", async () => {
      const obligation = financeObligationSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.financeObligations.add(obligation);
      notifyUserDataSyncTrigger({
        entity: "financeObligations",
        operation: "create",
      });
      return obligation;
    });
  }

  async updateObligation(
    id: string,
    input: UpdateFinanceObligationInput
  ): Promise<FinanceObligation> {
    return this.execute("updating a finance obligation", () =>
      this.database.transaction("rw", this.database.financeObligations, async () => {
        const current = this.requireEntity(
          "Finance obligation",
          id,
          await this.database.financeObligations.get(id)
        );
        const obligation = financeObligationSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.financeObligations.put(obligation);
        notifyUserDataSyncTrigger({
          entity: "financeObligations",
          operation: "update",
        });
        return obligation;
      })
    );
  }

  async deleteObligation(id: string): Promise<void> {
    return this.execute("deleting a finance obligation", () =>
      this.database.transaction("rw", this.database.financeObligations, async () => {
        this.requireEntity(
          "Finance obligation",
          id,
          await this.database.financeObligations.get(id)
        );
        await this.database.financeObligations.delete(id);
        notifyUserDataSyncTrigger({
          entity: "financeObligations",
          operation: "delete",
        });
      })
    );
  }

  async listCategoryBudgets(): Promise<FinanceCategoryBudget[]> {
    return this.execute("listing finance category budgets", async () => {
      const records = await this.database.financeCategoryBudgets.toArray();
      return records
        .map((record) => financeCategoryBudgetSchema.parse(record))
        .sort((left, right) => left.category.localeCompare(right.category));
    });
  }

  async getCategoryBudgetById(
    id: string
  ): Promise<FinanceCategoryBudget | undefined> {
    return this.execute("reading a finance category budget", async () => {
      const record = await this.database.financeCategoryBudgets.get(id);
      return record === undefined
        ? undefined
        : financeCategoryBudgetSchema.parse(record);
    });
  }

  async createCategoryBudget(
    input: CreateFinanceCategoryBudgetInput
  ): Promise<FinanceCategoryBudget> {
    return this.execute("creating a finance category budget", async () => {
      const budget = financeCategoryBudgetSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.financeCategoryBudgets.add(budget);
      return budget;
    });
  }

  async updateCategoryBudget(
    id: string,
    input: UpdateFinanceCategoryBudgetInput
  ): Promise<FinanceCategoryBudget> {
    return this.execute("updating a finance category budget", () =>
      this.database.transaction("rw", this.database.financeCategoryBudgets, async () => {
        const current = this.requireEntity(
          "Finance category budget",
          id,
          await this.database.financeCategoryBudgets.get(id)
        );
        const budget = financeCategoryBudgetSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.financeCategoryBudgets.put(budget);
        return budget;
      })
    );
  }

  async deleteCategoryBudget(id: string): Promise<void> {
    return this.execute("deleting a finance category budget", () =>
      this.database.transaction("rw", this.database.financeCategoryBudgets, async () => {
        this.requireEntity(
          "Finance category budget",
          id,
          await this.database.financeCategoryBudgets.get(id)
        );
        await this.database.financeCategoryBudgets.delete(id);
      })
    );
  }

  async listAssets(): Promise<FinanceAsset[]> {
    return this.execute("listing finance assets", async () => {
      const records = await this.database.financeAssets.toArray();
      return records
        .map((record) => financeAssetSchema.parse(record))
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt) ||
          left.title.localeCompare(right.title)
        );
    });
  }

  async getAssetById(id: string): Promise<FinanceAsset | undefined> {
    return this.execute("reading a finance asset", async () => {
      const record = await this.database.financeAssets.get(id);
      return record === undefined ? undefined : financeAssetSchema.parse(record);
    });
  }

  async createAsset(input: CreateFinanceAssetInput): Promise<FinanceAsset> {
    return this.execute("creating a finance asset", async () => {
      const asset = financeAssetSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.financeAssets.add(asset);
      return asset;
    });
  }

  async updateAsset(
    id: string,
    input: UpdateFinanceAssetInput
  ): Promise<FinanceAsset> {
    return this.execute("updating a finance asset", () =>
      this.database.transaction("rw", this.database.financeAssets, async () => {
        const current = this.requireEntity(
          "Finance asset",
          id,
          await this.database.financeAssets.get(id)
        );
        const asset = financeAssetSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.financeAssets.put(asset);
        return asset;
      })
    );
  }

  async deleteAsset(id: string): Promise<void> {
    return this.execute("deleting a finance asset", () =>
      this.database.transaction("rw", this.database.financeAssets, async () => {
        this.requireEntity(
          "Finance asset",
          id,
          await this.database.financeAssets.get(id)
        );
        await this.database.financeAssets.delete(id);
      })
    );
  }
}
