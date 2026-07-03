import type {
  CreateProjectInput,
  ProjectsRepository,
  UpdateProjectInput,
} from "@/core/repositories";
import { projectSchema, type Project } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieProjectsRepository
  extends DexieRepositoryBase
  implements ProjectsRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<Project[]> {
    return this.execute("listing projects", async () => {
      const records = await this.database.projects.toArray();
      return records.map((record) => projectSchema.parse(record));
    });
  }

  async getById(id: string): Promise<Project | undefined> {
    return this.execute("reading a project", async () => {
      const record = await this.database.projects.get(id);
      return record === undefined ? undefined : projectSchema.parse(record);
    });
  }

  async create(input: CreateProjectInput): Promise<Project> {
    return this.execute("creating a project", async () => {
      const project = projectSchema.parse({ ...input, ...this.createMetadata() });
      await this.database.projects.add(project);
      return project;
    });
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.execute("updating a project", () =>
      this.database.transaction("rw", this.database.projects, async () => {
        const current = this.requireEntity(
          "Project",
          id,
          await this.database.projects.get(id)
        );
        const project = projectSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.projects.put(project);
        return project;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a project", () =>
      this.database.transaction("rw", this.database.projects, async () => {
        this.requireEntity("Project", id, await this.database.projects.get(id));
        await this.database.projects.delete(id);
      })
    );
  }

  async archive(_id: string): Promise<Project> {
    return this.unavailable("Archiving projects");
  }
}
