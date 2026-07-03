import type {
  CreateDailyCheckinInput,
  DailyCheckinsRepository,
  UpdateDailyCheckinInput,
} from "@/core/repositories";
import { dailyCheckinSchema, type DailyCheckin } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieDailyCheckinsRepository
  extends DexieRepositoryBase
  implements DailyCheckinsRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<DailyCheckin[]> {
    return this.execute("listing daily check-ins", async () => {
      const records = await this.database.dailyCheckins.toArray();
      return records.map((record) => dailyCheckinSchema.parse(record));
    });
  }

  async getByDate(date: string): Promise<DailyCheckin | undefined> {
    return this.execute("reading a daily check-in", async () => {
      const record = await this.database.dailyCheckins
        .where("date")
        .equals(date)
        .first();
      return record === undefined ? undefined : dailyCheckinSchema.parse(record);
    });
  }

  async create(input: CreateDailyCheckinInput): Promise<DailyCheckin> {
    return this.execute("creating a daily check-in", async () => {
      const checkin = dailyCheckinSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.dailyCheckins.add(checkin);
      return checkin;
    });
  }

  async update(
    id: string,
    input: UpdateDailyCheckinInput
  ): Promise<DailyCheckin> {
    return this.execute("updating a daily check-in", () =>
      this.database.transaction("rw", this.database.dailyCheckins, async () => {
        const current = this.requireEntity(
          "DailyCheckin",
          id,
          await this.database.dailyCheckins.get(id)
        );
        const checkin = dailyCheckinSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.dailyCheckins.put(checkin);
        return checkin;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a daily check-in", () =>
      this.database.transaction("rw", this.database.dailyCheckins, async () => {
        this.requireEntity(
          "DailyCheckin",
          id,
          await this.database.dailyCheckins.get(id)
        );
        await this.database.dailyCheckins.delete(id);
      })
    );
  }
}
