import type {
  LifeArea,
  LifeAreaAttentionLevel,
  LifeAreaKey,
  LifeAreaStatus,
} from "@/shared/types";

export type CreateLifeAreaInput = Omit<
  LifeArea,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateLifeAreaInput = Partial<
  Omit<LifeArea, "id" | "areaKey" | "createdAt" | "updatedAt">
>;

export interface LifeAreasRepository {
  list(): Promise<LifeArea[]>;
  getByAreaKey(areaKey: LifeAreaKey): Promise<LifeArea | undefined>;
  upsert(input: CreateLifeAreaInput): Promise<LifeArea>;
  update(areaKey: LifeAreaKey, input: UpdateLifeAreaInput): Promise<LifeArea>;
  delete(areaKey: LifeAreaKey): Promise<void>;
  markReviewed(areaKey: LifeAreaKey): Promise<LifeArea>;
}
