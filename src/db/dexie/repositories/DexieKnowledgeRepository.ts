import type {
  CreateKnowledgeItemInput,
  KnowledgeRepository,
  UpdateKnowledgeItemInput,
} from "@/core/repositories";
import { knowledgeItemSchema, type KnowledgeItem } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieKnowledgeRepository
  extends DexieRepositoryBase
  implements KnowledgeRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<KnowledgeItem[]> {
    return this.execute("listing knowledge items", async () => {
      const records = await this.database.knowledgeItems.toArray();
      return records.map((record) => knowledgeItemSchema.parse(record));
    });
  }

  async search(query: string): Promise<KnowledgeItem[]> {
    return this.execute("searching knowledge items", async () => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const records = await this.database.knowledgeItems.toArray();
      const items = records.map((record) => knowledgeItemSchema.parse(record));

      if (normalizedQuery.length === 0) {
        return items;
      }

      return items.filter((item) =>
        [item.title, item.summary, item.content, item.source].some((value) =>
          value?.toLocaleLowerCase().includes(normalizedQuery)
        )
      );
    });
  }

  async getById(id: string): Promise<KnowledgeItem | undefined> {
    return this.execute("reading a knowledge item", async () => {
      const record = await this.database.knowledgeItems.get(id);
      return record === undefined ? undefined : knowledgeItemSchema.parse(record);
    });
  }

  async create(input: CreateKnowledgeItemInput): Promise<KnowledgeItem> {
    return this.execute("creating a knowledge item", async () => {
      const item = knowledgeItemSchema.parse({ ...input, ...this.createMetadata() });
      await this.database.knowledgeItems.add(item);
      return item;
    });
  }

  async update(
    id: string,
    input: UpdateKnowledgeItemInput
  ): Promise<KnowledgeItem> {
    return this.execute("updating a knowledge item", () =>
      this.database.transaction("rw", this.database.knowledgeItems, async () => {
        const current = this.requireEntity(
          "KnowledgeItem",
          id,
          await this.database.knowledgeItems.get(id)
        );
        const item = knowledgeItemSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.knowledgeItems.put(item);
        return item;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a knowledge item", () =>
      this.database.transaction("rw", this.database.knowledgeItems, async () => {
        this.requireEntity(
          "KnowledgeItem",
          id,
          await this.database.knowledgeItems.get(id)
        );
        await this.database.knowledgeItems.delete(id);
      })
    );
  }
}
