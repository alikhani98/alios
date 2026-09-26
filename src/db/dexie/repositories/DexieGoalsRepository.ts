import {
  type CreateGoalInput,
  type GoalsRepository,
  type UpdateGoalInput,
} from "@/core/repositories";
import { notifyUserDataSyncTrigger } from "@/core/sync";
import { goalSchema, type Goal } from "@/shared/types";

import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";
import { DexieMutationOutboxRepository } from "./DexieMutationOutboxRepository";

function clampProgressPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.trunc(value)));
}

export class DexieGoalsRepository
  extends DexieRepositoryBase
  implements GoalsRepository
{
  private readonly mutationOutbox: DexieMutationOutboxRepository;

  constructor(database: AliosDatabase) {
    super(database);
    this.mutationOutbox = new DexieMutationOutboxRepository(database);
  }

  async list(): Promise<Goal[]> {
    return this.execute("listing goals", async () => {
      const records = await this.database.goals.toArray();
      return records.map((record) => goalSchema.parse(record));
    });
  }

  async getById(id: string): Promise<Goal | undefined> {
    return this.execute("reading a goal", async () => {
      const record = await this.database.goals.get(id);
      return record === undefined ? undefined : goalSchema.parse(record);
    });
  }

  async create(input: CreateGoalInput): Promise<Goal> {
    return this.execute("creating a goal", () =>
      this.database.transaction(
        "rw",
        this.database.goals,
        this.database.mutationOutbox,
        async () => {
          const goal = goalSchema.parse({
            ...input,
            progressPercent: clampProgressPercent(input.progressPercent),
            ...this.createMetadata(),
          });
          await this.database.goals.add(goal);
          await this.mutationOutbox.enqueue({
            entity: "goals",
            operation: "create",
            recordId: goal.id,
            payload: goal,
          });
          notifyUserDataSyncTrigger({ entity: "goals", operation: "create" });
          return goal;
        }
      )
    );
  }

  async update(id: string, input: UpdateGoalInput): Promise<Goal> {
    return this.execute("updating a goal", () =>
      this.database.transaction(
        "rw",
        this.database.goals,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "Goal",
            id,
            await this.database.goals.get(id)
          );
          const goal = goalSchema.parse({
            ...current,
            ...input,
            id: current.id,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString(),
            progressPercent:
              input.progressPercent === undefined
                ? current.progressPercent
                : clampProgressPercent(input.progressPercent),
          });
          await this.database.goals.put(goal);
          await this.mutationOutbox.enqueue({
            entity: "goals",
            operation: "update",
            recordId: goal.id,
            payload: goal,
          });
          notifyUserDataSyncTrigger({ entity: "goals", operation: "update" });
          return goal;
        }
      )
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a goal", () =>
      this.database.transaction(
        "rw",
        this.database.goals,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "Goal",
            id,
            await this.database.goals.get(id)
          );
          await this.database.goals.delete(id);
          await this.mutationOutbox.enqueue({
            entity: "goals",
            operation: "delete",
            recordId: current.id,
            payload: current,
          });
          notifyUserDataSyncTrigger({ entity: "goals", operation: "delete" });
        }
      )
    );
  }

  async markReviewed(id: string): Promise<Goal> {
    return this.update(id, { lastReviewedAt: new Date().toISOString() });
  }

  async updateProgress(id: string, progressPercent: number): Promise<Goal> {
    return this.update(id, { progressPercent });
  }

  async markCompleted(id: string): Promise<Goal> {
    return this.update(id, { status: "completed", progressPercent: 100 });
  }

  async reactivate(id: string): Promise<Goal> {
    return this.update(id, { status: "active" });
  }
}
