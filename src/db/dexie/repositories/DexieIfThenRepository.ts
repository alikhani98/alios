import type { AddIfThenPlanInput, IfThenRepository } from "@/core/repositories";
import { ifThenPlanSchema, type IfThenPlan } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

function sortNewestFirst(plans: IfThenPlan[]): IfThenPlan[] {
  return [...plans].sort((first, second) => {
    const dateCompare = second.createdAt.localeCompare(first.createdAt);
    return dateCompare === 0
      ? first.ifTrigger.localeCompare(second.ifTrigger)
      : dateCompare;
  });
}

export class DexieIfThenRepository
  extends DexieRepositoryBase
  implements IfThenRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async getActivePlans(): Promise<IfThenPlan[]> {
    return this.execute("listing active if-then plans", async () => {
      const records = await this.database.ifThenPlans.toArray();

      return sortNewestFirst(
        records
          .map((record) => ifThenPlanSchema.parse(record))
          .filter((plan) => plan.isActive)
      );
    });
  }

  async getAllPlans(): Promise<IfThenPlan[]> {
    return this.execute("listing if-then plans", async () => {
      const records = await this.database.ifThenPlans.toArray();
      return sortNewestFirst(
        records.map((record) => ifThenPlanSchema.parse(record))
      );
    });
  }

  async addPlan(data: AddIfThenPlanInput): Promise<void> {
    return this.execute("creating an if-then plan", async () => {
      const timestamp = new Date().toISOString();
      const record = ifThenPlanSchema.parse({
        ...data,
        id: crypto.randomUUID(),
        isActive: data.isActive ?? true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await this.database.ifThenPlans.put(record);
    });
  }

  async toggleActive(id: string): Promise<void> {
    return this.execute("toggling an if-then plan", async () => {
      const current = this.requireEntity(
        "If-Then plan",
        id,
        await this.database.ifThenPlans.get(id)
      );
      const record = ifThenPlanSchema.parse({
        ...current,
        isActive: !current.isActive,
        updatedAt: new Date().toISOString(),
      });

      await this.database.ifThenPlans.put(record);
    });
  }

  async deletePlan(id: string): Promise<void> {
    return this.execute("deleting an if-then plan", async () => {
      this.requireEntity(
        "If-Then plan",
        id,
        await this.database.ifThenPlans.get(id)
      );
      await this.database.ifThenPlans.delete(id);
    });
  }
}
