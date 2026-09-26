import type {
  CreateProjectInput,
  ProjectsRepository,
  UpdateProjectInput,
} from "@/core/repositories";
import { notifyUserDataSyncTrigger } from "@/core/sync";
import { projectSchema, type Project } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";
import { DexieMutationOutboxRepository } from "./DexieMutationOutboxRepository";

export class DexieProjectsRepository
  extends DexieRepositoryBase
  implements ProjectsRepository
{
  private readonly mutationOutbox: DexieMutationOutboxRepository;

  constructor(database: AliosDatabase) {
    super(database);
    this.mutationOutbox = new DexieMutationOutboxRepository(database);
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
    return this.execute("creating a project", () =>
      this.database.transaction(
        "rw",
        this.database.projects,
        this.database.mutationOutbox,
        async () => {
          const project = projectSchema.parse({
            ...input,
            ...this.createMetadata(),
          });
          await this.database.projects.add(project);
          await this.mutationOutbox.enqueue({
            entity: "projects",
            operation: "create",
            recordId: project.id,
            payload: project,
          });
          notifyUserDataSyncTrigger({ entity: "projects", operation: "create" });
          return project;
        }
      )
    );
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.execute("updating a project", () =>
      this.database.transaction(
        "rw",
        this.database.projects,
        this.database.mutationOutbox,
        async () => {
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
          await this.mutationOutbox.enqueue({
            entity: "projects",
            operation: "update",
            recordId: project.id,
            payload: project,
          });
          notifyUserDataSyncTrigger({ entity: "projects", operation: "update" });
          return project;
        }
      )
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a project", () =>
      this.database.transaction(
        "rw",
        this.database.projects,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "Project",
            id,
            await this.database.projects.get(id)
          );
          await this.database.projects.delete(id);
          await this.mutationOutbox.enqueue({
            entity: "projects",
            operation: "delete",
            recordId: current.id,
            payload: current,
          });
          notifyUserDataSyncTrigger({ entity: "projects", operation: "delete" });
        }
      )
    );
  }

  async archive(_id: string): Promise<Project> {
    return this.unavailable("Archiving projects");
  }
}
