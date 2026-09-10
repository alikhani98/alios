import type {
  CreateResourceInput,
  ResourceRepository,
  UpdateResourceInput,
} from "@/core/repositories";
import { resourceSchema, type Resource } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieResourceRepository
  extends DexieRepositoryBase
  implements ResourceRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<Resource[]> {
    return this.execute("listing resources", async () => {
      const records = await this.database.resources.toArray();
      return records.map((record) => resourceSchema.parse(record));
    });
  }

  async search(query: string): Promise<Resource[]> {
    return this.execute("searching resources", async () => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const records = await this.database.resources.toArray();
      const resources = records.map((record) => resourceSchema.parse(record));

      if (!normalizedQuery) {
        return resources;
      }

      return resources.filter((resource) =>
        [
          resource.title,
          resource.description,
          resource.source,
          resource.url,
          resource.author,
          resource.format,
          resource.location,
        ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))
      );
    });
  }

  async getById(id: string): Promise<Resource | undefined> {
    return this.execute("reading a resource", async () => {
      const record = await this.database.resources.get(id);
      return record === undefined ? undefined : resourceSchema.parse(record);
    });
  }

  async create(input: CreateResourceInput): Promise<Resource> {
    return this.execute("creating a resource", async () => {
      const resource = resourceSchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.resources.add(resource);
      return resource;
    });
  }

  async update(
    id: string,
    input: UpdateResourceInput
  ): Promise<Resource> {
    return this.execute("updating a resource", () =>
      this.database.transaction("rw", this.database.resources, async () => {
        const current = this.requireEntity(
          "Resource",
          id,
          await this.database.resources.get(id)
        );
        const resource = resourceSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.resources.put(resource);
        return resource;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a resource", () =>
      this.database.transaction("rw", this.database.resources, async () => {
        this.requireEntity(
          "Resource",
          id,
          await this.database.resources.get(id)
        );
        await this.database.resources.delete(id);
      })
    );
  }
}
