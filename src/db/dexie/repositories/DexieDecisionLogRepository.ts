import type {
  CreateDecisionLogEntryInput,
  DecisionLogRepository,
  UpdateDecisionLogEntryInput,
} from "@/core/repositories";
import { decisionLogEntrySchema, type DecisionLogEntry } from "@/shared/types";

import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieDecisionLogRepository
  extends DexieRepositoryBase
  implements DecisionLogRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<DecisionLogEntry[]> {
    return this.execute("listing decision log entries", async () => {
      const records = await this.database.decisionLogEntries.toArray();
      return records.map((record) => decisionLogEntrySchema.parse(record));
    });
  }

  async create(input: CreateDecisionLogEntryInput): Promise<DecisionLogEntry> {
    return this.execute("creating a decision log entry", async () => {
      const entry = decisionLogEntrySchema.parse({
        ...input,
        ...this.createMetadata(),
      });
      await this.database.decisionLogEntries.add(entry);
      return entry;
    });
  }

  async update(
    id: string,
    input: UpdateDecisionLogEntryInput
  ): Promise<DecisionLogEntry> {
    return this.execute("updating a decision log entry", () =>
      this.database.transaction("rw", this.database.decisionLogEntries, async () => {
        const current = this.requireEntity(
          "DecisionLogEntry",
          id,
          await this.database.decisionLogEntries.get(id)
        );
        const entry = decisionLogEntrySchema.parse({
          ...current,
          ...input,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        });
        await this.database.decisionLogEntries.put(entry);
        return entry;
      })
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting a decision log entry", () =>
      this.database.transaction("rw", this.database.decisionLogEntries, async () => {
        this.requireEntity(
          "DecisionLogEntry",
          id,
          await this.database.decisionLogEntries.get(id)
        );
        await this.database.decisionLogEntries.delete(id);
      })
    );
  }
}
