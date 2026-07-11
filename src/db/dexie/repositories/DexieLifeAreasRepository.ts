import {
  type CreateLifeAreaInput,
  type LifeAreasRepository,
  type UpdateLifeAreaInput,
} from "@/core/repositories";
import { lifeAreaSchema, type LifeArea } from "@/shared/types";

import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieLifeAreasRepository
  extends DexieRepositoryBase
  implements LifeAreasRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<LifeArea[]> {
    return this.execute("listing life areas", async () => {
      const records = await this.database.lifeAreas.toArray();
      return records.map((record) => lifeAreaSchema.parse(record));
    });
  }

  async getByAreaKey(areaKey: LifeArea["areaKey"]): Promise<LifeArea | undefined> {
    return this.execute("reading a life area", async () => {
      const record = await this.database.lifeAreas.get(areaKey);
      return record === undefined ? undefined : lifeAreaSchema.parse(record);
    });
  }

  async upsert(input: CreateLifeAreaInput): Promise<LifeArea> {
    return this.execute("updating a life area", async () => {
      const existing = await this.database.lifeAreas.get(input.areaKey);
      const timestamp = new Date().toISOString();
      const area = lifeAreaSchema.parse({
        ...(existing ?? {}),
        ...input,
        id: input.areaKey,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      await this.database.lifeAreas.put(area);
      return area;
    });
  }

  async update(
    areaKey: LifeArea["areaKey"],
    input: UpdateLifeAreaInput
  ): Promise<LifeArea> {
    return this.execute("updating a life area", async () => {
      const current = this.requireEntity(
        "LifeArea",
        areaKey,
        await this.database.lifeAreas.get(areaKey)
      );

      const area = lifeAreaSchema.parse({
        ...current,
        ...input,
        id: current.id,
        areaKey: current.areaKey,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      });

      await this.database.lifeAreas.put(area);
      return area;
    });
  }

  async delete(areaKey: LifeArea["areaKey"]): Promise<void> {
    return this.execute("deleting a life area", async () => {
      this.requireEntity(
        "LifeArea",
        areaKey,
        await this.database.lifeAreas.get(areaKey)
      );
      await this.database.lifeAreas.delete(areaKey);
    });
  }

  async markReviewed(areaKey: LifeArea["areaKey"]): Promise<LifeArea> {
    return this.update(areaKey, { lastReviewedAt: new Date().toISOString() });
  }
}
