import type {
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  FinanceRepository,
  UpdateFinanceObligationInput,
  UpdateFinanceTransactionInput,
} from "@/core/repositories";
import {
  financeObligationSchema,
  financeTransactionSchema,
  type FinanceObligation,
  type FinanceTransaction,
} from "@/shared/types";
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
      })
    );
  }
}
