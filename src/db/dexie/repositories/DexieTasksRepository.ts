import type {
  CreateTaskInput,
  TasksRepository,
  UpdateTaskInput,
} from "@/core/repositories";
import type { Task } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieTasksRepository
  extends DexieRepositoryBase
  implements TasksRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<Task[]> {
    return this.unavailable("Listing tasks");
  }

  async getById(_id: string): Promise<Task | undefined> {
    return this.unavailable("Reading a task");
  }

  async create(_input: CreateTaskInput): Promise<Task> {
    return this.unavailable("Creating a task");
  }

  async update(_id: string, _input: UpdateTaskInput): Promise<Task> {
    return this.unavailable("Updating a task");
  }

  async delete(_id: string): Promise<void> {
    return this.unavailable("Deleting a task");
  }
}
