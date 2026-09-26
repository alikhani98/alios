import type {
  CreateManualEntryInput,
  ManualRepository,
  UpdateManualEntryInput,
} from "@/core/repositories";
import { notifyUserDataSyncTrigger } from "@/core/sync";
import { manualEntrySchema, type ManualEntry } from "@/shared/types";

import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";
import { DexieMutationOutboxRepository } from "./DexieMutationOutboxRepository";

export class DexieManualRepository
  extends DexieRepositoryBase
  implements ManualRepository
{
  private readonly mutationOutbox: DexieMutationOutboxRepository;

  constructor(database: AliosDatabase) {
    super(database);
    this.mutationOutbox = new DexieMutationOutboxRepository(database);
  }

  async list(): Promise<ManualEntry[]> {
    return this.execute("listing manual entries", async () => {
      const records = await this.database.manualEntries.toArray();
      return records.map((record) => manualEntrySchema.parse(record));
    });
  }

  async getById(id: string): Promise<ManualEntry | undefined> {
    return this.execute("reading a manual entry", async () => {
      const record = await this.database.manualEntries.get(id);
      return record === undefined ? undefined : manualEntrySchema.parse(record);
    });
  }

  async create(input: CreateManualEntryInput): Promise<ManualEntry> {
    return this.execute("creating a manual entry", () =>
      this.database.transaction(
        "rw",
        this.database.manualEntries,
        this.database.mutationOutbox,
        async () => {
          const entry = manualEntrySchema.parse({
            ...input,
            ...this.createMetadata(),
          });
          await this.database.manualEntries.add(entry);
          await this.mutationOutbox.enqueue({
            entity: "manualEntries",
            operation: "create",
            recordId: entry.id,
            payload: entry,
          });
          notifyUserDataSyncTrigger({
            entity: "manualEntries",
            operation: "create",
          });
          return entry;
        }
      )
    );
  }

  async update(
    id: string,
    input: UpdateManualEntryInput
  ): Promise<ManualEntry> {
    return this.execute("updating a manual entry", () =>
      this.database.transaction(
        "rw",
        this.database.manualEntries,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "ManualEntry",
            id,
            await this.database.manualEntries.get(id)
          );
          const entry = manualEntrySchema.parse({
            ...current,
            ...input,
            id: current.id,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString(),
          });
          await this.database.manualEntries.put(entry);
          await this.mutationOutbox.enqueue({
            entity: "manualEntries",
            operation: "update",
            recordId: entry.id,
            payload: entry,
          });
          notifyUserDataSyncTrigger({
            entity: "manualEntries",
            operation: "update",
          });
          return entry;
        }
      )
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a manual entry", () =>
      this.database.transaction(
        "rw",
        this.database.manualEntries,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "ManualEntry",
            id,
            await this.database.manualEntries.get(id)
          );
          await this.database.manualEntries.delete(id);
          await this.mutationOutbox.enqueue({
            entity: "manualEntries",
            operation: "delete",
            recordId: current.id,
            payload: current,
          });
          notifyUserDataSyncTrigger({
            entity: "manualEntries",
            operation: "delete",
          });
        }
      )
    );
  }
}
