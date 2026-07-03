import type {
  CreateDailyCheckinInput,
  DailyCheckinsRepository,
  UpdateDailyCheckinInput,
} from "@/core/repositories";
import type { DailyCheckin } from "@/shared/types";
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
    return this.unavailable("Listing daily check-ins");
  }

  async getByDate(_date: string): Promise<DailyCheckin | undefined> {
    return this.unavailable("Reading a daily check-in");
  }

  async create(_input: CreateDailyCheckinInput): Promise<DailyCheckin> {
    return this.unavailable("Creating a daily check-in");
  }

  async update(
    _id: string,
    _input: UpdateDailyCheckinInput
  ): Promise<DailyCheckin> {
    return this.unavailable("Updating a daily check-in");
  }

  async delete(_id: string): Promise<void> {
    return this.unavailable("Deleting a daily check-in");
  }
}
