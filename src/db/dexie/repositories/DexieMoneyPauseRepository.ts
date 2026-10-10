import type {
  AddMoneyPauseInput,
  MoneyPauseRepository,
} from "@/core/repositories";
import {
  moneyPauseSchema,
  type MoneyPause,
  type MoneyPauseDecision,
} from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

function addHours(date: Date, hours: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, days - 1));
  return date.toISOString();
}

function sortNewestFirst(items: MoneyPause[]): MoneyPause[] {
  return [...items].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt)
  );
}

export class DexieMoneyPauseRepository
  extends DexieRepositoryBase
  implements MoneyPauseRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async addPause(data: AddMoneyPauseInput): Promise<void> {
    return this.execute("saving a money pause", async () => {
      const createdAt = new Date();
      const record = moneyPauseSchema.parse({
        ...data,
        id: crypto.randomUUID(),
        item: data.item.trim(),
        currency: data.currency ?? "IRR",
        createdAt: createdAt.toISOString(),
        reviewAt: addHours(createdAt, 24).toISOString(),
      });

      await this.database.moneyPauses.put(record);
    });
  }

  async getPendingPauses(): Promise<MoneyPause[]> {
    return this.execute("listing pending money pauses", async () => {
      const now = new Date().toISOString();
      const records = await this.database.moneyPauses.toArray();

      return sortNewestFirst(
        records
          .map((record) => moneyPauseSchema.parse(record))
          .filter((record) => record.reviewAt <= now && !record.decision)
      );
    });
  }

  async decide(id: string, decision: MoneyPauseDecision): Promise<void> {
    return this.execute("saving a money pause decision", async () => {
      const current = await this.database.moneyPauses.get(id);

      if (!current) {
        return;
      }

      const record = moneyPauseSchema.parse({
        ...current,
        decision,
        decidedAt: new Date().toISOString(),
      });

      await this.database.moneyPauses.put(record);
    });
  }

  async getRecentPauses(days: number): Promise<MoneyPause[]> {
    return this.execute("listing recent money pauses", async () => {
      if (days <= 0) {
        return [];
      }

      const records = await this.database.moneyPauses
        .where("createdAt")
        .aboveOrEqual(getDateDaysAgo(days))
        .toArray();

      return sortNewestFirst(
        records.map((record) => moneyPauseSchema.parse(record))
      );
    });
  }
}
