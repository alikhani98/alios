import type {
  DailyCommitmentReflectionInput,
  DailyCommitmentsRepository,
  UpsertDailyCommitmentInput,
} from "@/core/repositories";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { dailyCommitmentSchema, type DailyCommitment } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieDailyCommitmentsRepository
  extends DexieRepositoryBase
  implements DailyCommitmentsRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async getTodayCommitment(): Promise<DailyCommitment | undefined> {
    return this.getCommitmentByDate(getLocalDateKey(new Date()));
  }

  async getCommitmentByDate(date: string): Promise<DailyCommitment | undefined> {
    return this.execute("reading a daily commitment", async () => {
      const record = await this.database.dailyCommitments
        .where("date")
        .equals(date)
        .first();
      return record === undefined
        ? undefined
        : dailyCommitmentSchema.parse(record);
    });
  }

  async upsertCommitment(data: UpsertDailyCommitmentInput): Promise<void> {
    return this.execute("saving a daily commitment", () =>
      this.database.transaction(
        "rw",
        this.database.dailyCommitments,
        async () => {
          const current = await this.database.dailyCommitments
            .where("date")
            .equals(data.date)
            .first();
          const timestamp = new Date().toISOString();
          const commitment = dailyCommitmentSchema.parse({
            ...current,
            ...data,
            id: current?.id ?? data.id ?? crypto.randomUUID(),
            createdAt: current?.createdAt ?? timestamp,
            updatedAt: timestamp,
          });

          await this.database.dailyCommitments.put(commitment);
        }
      )
    );
  }

  async markStarted(date: string): Promise<void> {
    return this.execute("marking a daily commitment started", () =>
      this.database.transaction(
        "rw",
        this.database.dailyCommitments,
        async () => {
          const current = this.requireEntity(
            "DailyCommitment",
            date,
            await this.database.dailyCommitments
              .where("date")
              .equals(date)
              .first()
          );
          const timestamp = new Date().toISOString();
          const commitment = dailyCommitmentSchema.parse({
            ...current,
            didStart: true,
            startedAt: timestamp,
            updatedAt: timestamp,
          });

          await this.database.dailyCommitments.put(commitment);
        }
      )
    );
  }

  async saveEveningReflection(
    date: string,
    fields: DailyCommitmentReflectionInput
  ): Promise<void> {
    return this.execute("saving a daily commitment reflection", () =>
      this.database.transaction(
        "rw",
        this.database.dailyCommitments,
        async () => {
          const current = this.requireEntity(
            "DailyCommitment",
            date,
            await this.database.dailyCommitments
              .where("date")
              .equals(date)
              .first()
          );
          const commitment = dailyCommitmentSchema.parse({
            ...current,
            ...fields,
            updatedAt: new Date().toISOString(),
          });

          await this.database.dailyCommitments.put(commitment);
        }
      )
    );
  }

  async getRecentCommitments(days: number): Promise<DailyCommitment[]> {
    return this.execute("listing recent daily commitments", async () => {
      const records = await this.database.dailyCommitments
        .orderBy("date")
        .reverse()
        .limit(Math.max(0, days))
        .toArray();

      return records.map((record) => dailyCommitmentSchema.parse(record));
    });
  }
}
