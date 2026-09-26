import type {
  EnqueueMutationOutboxInput,
  MutationOutboxEntry,
  MutationOutboxRepository,
} from "@/core/sync/mutationOutbox";
import type { AliosDatabase } from "../db";

export class DexieMutationOutboxRepository
  implements MutationOutboxRepository
{
  constructor(private readonly database: AliosDatabase) {}

  async enqueue(
    input: EnqueueMutationOutboxInput
  ): Promise<MutationOutboxEntry> {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    const entry: MutationOutboxEntry = {
      ...input,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "pending",
      attemptCount: 0,
      idempotencyKey: id,
      ...(input.operation === "delete"
        ? { deletedAt: input.deletedAt ?? timestamp }
        : {}),
    };
    await this.database.mutationOutbox.add(entry);
    return entry;
  }

  async list(): Promise<MutationOutboxEntry[]> {
    return this.database.mutationOutbox.toArray();
  }

  async listPending(): Promise<MutationOutboxEntry[]> {
    return this.database.mutationOutbox
      .where("status")
      .equals("pending")
      .toArray();
  }

  async getById(id: string): Promise<MutationOutboxEntry | undefined> {
    return this.database.mutationOutbox.get(id);
  }
}
