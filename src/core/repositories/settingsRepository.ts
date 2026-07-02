import type { Setting } from "@/shared/types";

export type CreateSettingInput = Omit<Setting, "id" | "createdAt" | "updatedAt">;
export type UpdateSettingInput = Partial<CreateSettingInput>;

export interface SettingsRepository {
  list(): Promise<Setting[]>;
  getByKey(key: string): Promise<Setting | undefined>;
  create(input: CreateSettingInput): Promise<Setting>;
  update(id: string, input: UpdateSettingInput): Promise<Setting>;
  delete(id: string): Promise<void>;
}
