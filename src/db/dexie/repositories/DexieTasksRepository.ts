import type {
  CreateTaskInput,
  CreateRoutineTaskInput,
  CreateRoutineTaskResult,
  TasksRepository,
  UpdateTaskInput,
} from "@/core/repositories";
import { taskSchema, type Task } from "@/shared/types";
import { getNextTaskRecurrenceDate } from "@/shared/task-recurrence";
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
    return this.execute("listing tasks", async () => {
      const records = await this.database.tasks.toArray();
      return records.map((record) => taskSchema.parse(record));
    });
  }

  async getById(id: string): Promise<Task | undefined> {
    return this.execute("reading a task", async () => {
      const record = await this.database.tasks.get(id);
      return record === undefined ? undefined : taskSchema.parse(record);
    });
  }

  async create(input: CreateTaskInput): Promise<Task> {
    return this.execute("creating a task", async () => {
      const metadata = this.createMetadata();
      const task = taskSchema.parse({
        ...input,
        ...metadata,
        recurrenceSeriesId: input.recurrence ? metadata.id : undefined,
      });
      await this.database.tasks.add(task);
      return task;
    });
  }

  async createFromRoutine(input: CreateRoutineTaskInput): Promise<CreateRoutineTaskResult> {
    return this.execute("creating a task from a routine", () =>
      this.database.transaction("rw", this.database.tasks, async () => {
        const existing = await this.database.tasks
          .where("[routineId+dueDate]")
          .equals([input.routineId, input.dueDate])
          .first();
        if (existing) return { task: taskSchema.parse(existing), created: false };
        const task = taskSchema.parse({ ...input, ...this.createMetadata() });
        await this.database.tasks.add(task);
        return { task, created: true };
      })
    );
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    return this.execute("updating a task", () =>
      this.database.transaction("rw", this.database.tasks, async () => {
        const current = this.requireEntity(
          "Task",
          id,
          await this.database.tasks.get(id)
        );
        const task = taskSchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.tasks.put(task);
        const nextDueDate =
          current.status !== "done" && input.status === "done"
            ? getNextTaskRecurrenceDate(task)
            : undefined;

        if (nextDueDate && task.recurrence) {
          const recurrenceSeriesId = task.recurrenceSeriesId ?? task.id;
          const existingNextTask = await this.database.tasks
            .where("[recurrenceSeriesId+dueDate]")
            .equals([recurrenceSeriesId, nextDueDate])
            .first();

          if (!existingNextTask) {
            const metadata = this.createMetadata();
            const nextTask = taskSchema.parse({
              ...task,
              ...metadata,
              status: "todo",
              isMit: false,
              dueDate: nextDueDate,
              recurrenceSeriesId,
              completedAt: undefined,
            });
            await this.database.tasks.add(nextTask);
          }
        }
        return task;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a task", () =>
      this.database.transaction("rw", this.database.tasks, async () => {
        this.requireEntity("Task", id, await this.database.tasks.get(id));
        await this.database.tasks.delete(id);
      })
    );
  }
}
