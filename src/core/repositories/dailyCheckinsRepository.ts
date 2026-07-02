import type { DailyCheckin } from "@/shared/types";

export type CreateDailyCheckinInput = Omit<
  DailyCheckin,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateDailyCheckinInput = Partial<CreateDailyCheckinInput>;

export interface DailyCheckinsRepository {
  list(): Promise<DailyCheckin[]>;
  getByDate(date: string): Promise<DailyCheckin | undefined>;
  create(input: CreateDailyCheckinInput): Promise<DailyCheckin>;
  update(id: string, input: UpdateDailyCheckinInput): Promise<DailyCheckin>;
  delete(id: string): Promise<void>;
}
