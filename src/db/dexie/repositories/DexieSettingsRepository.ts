import type {
  CreateSettingInput,
  SettingsRepository,
  UpdateSettingInput,
} from "@/core/repositories";
import { settingSchema, type Setting } from "@/shared/types";
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
    return this.execute("listing settings", async () => {
      const records = await this.database.settings.toArray();
      return records.map((record) => settingSchema.parse(record));
    });
  }

  async getByKey(key: string): Promise<Setting | undefined> {
    return this.execute("reading a setting", async () => {
      const record = await this.database.settings.where("key").equals(key).first();
      return record === undefined ? undefined : settingSchema.parse(record);
    });
  }

  async create(input: CreateSettingInput): Promise<Setting> {
    return this.execute("creating a setting", async () => {
      const setting = settingSchema.parse({ ...input, ...this.createMetadata() });
      await this.database.settings.add(setting);
      return setting;
    });
  }

  async update(id: string, input: UpdateSettingInput): Promise<Setting> {
    return this.execute("updating a setting", () =>
      this.database.transaction("rw", this.database.settings, async () => {
        const current = this.requireEntity(
          "Setting",
          id,
          await this.database.settings.get(id)
        );
        const setting = settingSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.settings.put(setting);
        return setting;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a setting", () =>
      this.database.transaction("rw", this.database.settings, async () => {
        this.requireEntity("Setting", id, await this.database.settings.get(id));
        await this.database.settings.delete(id);
      })
    );
  }
}
