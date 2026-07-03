import type {
  CreateSettingInput,
  SettingsRepository,
  UpdateSettingInput,
} from "@/core/repositories";
import type { Setting } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieSettingsRepository
  extends DexieRepositoryBase
  implements SettingsRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<Setting[]> {
    return this.unavailable("Listing settings");
  }

  async getByKey(_key: string): Promise<Setting | undefined> {
    return this.unavailable("Reading a setting");
  }

  async create(_input: CreateSettingInput): Promise<Setting> {
    return this.unavailable("Creating a setting");
  }

  async update(_id: string, _input: UpdateSettingInput): Promise<Setting> {
    return this.unavailable("Updating a setting");
  }

  async delete(_id: string): Promise<void> {
    return this.unavailable("Deleting a setting");
  }
}
