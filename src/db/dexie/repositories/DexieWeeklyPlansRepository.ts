import type { SaveWeeklyPlanInput, WeeklyPlansRepository } from "@/core/repositories";
import { weeklyPlanSchema, type WeeklyPlan } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieWeeklyPlansRepository extends DexieRepositoryBase implements WeeklyPlansRepository {
  constructor(database: AliosDatabase) { super(database); }

  async getByWeekStart(weekStart: string): Promise<WeeklyPlan | undefined> {
    return this.execute("reading a weekly plan", async () => {
      const record = await this.database.weeklyPlans.where("weekStart").equals(weekStart).first();
      return record === undefined ? undefined : weeklyPlanSchema.parse(record);
    });
  }

  async save(input: SaveWeeklyPlanInput): Promise<WeeklyPlan> {
    return this.execute("saving a weekly plan", () => this.database.transaction("rw", this.database.weeklyPlans, async () => {
      const current = await this.database.weeklyPlans.where("weekStart").equals(input.weekStart).first();
      const plan = weeklyPlanSchema.parse({
        ...current,
        ...input,
        id: current?.id ?? crypto.randomUUID(),
        createdAt: current?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await this.database.weeklyPlans.put(plan);
      return plan;
    }));
  }
}
