import type {
  CreateKnowledgeItemInput,
  KnowledgeRepository,
  UpdateKnowledgeItemInput,
} from "@/core/repositories";
import type { KnowledgeItem } from "@/shared/types";
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
    return this.unavailable("Listing knowledge items");
  }

  async search(_query: string): Promise<KnowledgeItem[]> {
    return this.unavailable("Searching knowledge items");
  }

  async getById(_id: string): Promise<KnowledgeItem | undefined> {
    return this.unavailable("Reading a knowledge item");
  }

  async create(_input: CreateKnowledgeItemInput): Promise<KnowledgeItem> {
    return this.unavailable("Creating a knowledge item");
  }

  async update(
    _id: string,
    _input: UpdateKnowledgeItemInput
  ): Promise<KnowledgeItem> {
    return this.unavailable("Updating a knowledge item");
  }

  async delete(_id: string): Promise<void> {
    return this.unavailable("Deleting a knowledge item");
  }
}
