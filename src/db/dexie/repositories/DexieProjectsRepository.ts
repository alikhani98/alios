import type {
  CreateProjectInput,
  ProjectsRepository,
  UpdateProjectInput,
} from "@/core/repositories";
import type { Project } from "@/shared/types";
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
    return this.unavailable("Listing projects");
  }

  async getById(_id: string): Promise<Project | undefined> {
    return this.unavailable("Reading a project");
  }

  async create(_input: CreateProjectInput): Promise<Project> {
    return this.unavailable("Creating a project");
  }

  async update(_id: string, _input: UpdateProjectInput): Promise<Project> {
    return this.unavailable("Updating a project");
  }

  async delete(_id: string): Promise<void> {
    return this.unavailable("Deleting a project");
  }

  async archive(_id: string): Promise<Project> {
    return this.unavailable("Archiving a project");
  }
}
