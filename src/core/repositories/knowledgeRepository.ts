import type { KnowledgeItem } from "@/shared/types";

export type CreateKnowledgeItemInput = Omit<
  KnowledgeItem,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateKnowledgeItemInput = Partial<CreateKnowledgeItemInput>;

export interface KnowledgeRepository {
  list(): Promise<KnowledgeItem[]>;
  search(query: string): Promise<KnowledgeItem[]>;
  getById(id: string): Promise<KnowledgeItem | undefined>;
  create(input: CreateKnowledgeItemInput): Promise<KnowledgeItem>;
  update(id: string, input: UpdateKnowledgeItemInput): Promise<KnowledgeItem>;
  delete(id: string): Promise<void>;
}
