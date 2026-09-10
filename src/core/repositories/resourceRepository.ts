import type { Resource } from "@/shared/types";

export type CreateResourceInput = Omit<
  Resource,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateResourceInput = Partial<CreateResourceInput>;

export interface ResourceRepository {
  list(): Promise<Resource[]>;
  search(query: string): Promise<Resource[]>;
  getById(id: string): Promise<Resource | undefined>;
  create(input: CreateResourceInput): Promise<Resource>;
  update(id: string, input: UpdateResourceInput): Promise<Resource>;
  delete(id: string): Promise<void>;
}
