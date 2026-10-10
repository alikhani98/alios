import { addDays, format } from "date-fns";

import type {
  AddExperimentLogInput,
  CreateExperimentInput,
  ExperimentRepository,
} from "@/core/repositories";
import type { AliosDatabase } from "@/db/dexie/db";
import {
  type Experiment,
  type ExperimentLog,
  type ExperimentStatus,
  experimentLogSchema,
  experimentSchema,
} from "@/shared/types";

import { DexieRepositoryBase } from "./DexieRepositoryBase";

function createId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function getExperimentEndDate(startDate: string): string {
  return format(addDays(new Date(`${startDate}T00:00:00`), 13), "yyyy-MM-dd");
}

export class DexieExperimentsRepository
  extends DexieRepositoryBase
  implements ExperimentRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async createExperiment(input: CreateExperimentInput): Promise<Experiment> {
    return this.execute("createExperiment", async () => {
      const timestamp = nowIso();
      const experiment = experimentSchema.parse({
        ...input,
        id: createId(),
        endDate: getExperimentEndDate(input.startDate),
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await this.database.experiments.put(experiment);
      return experiment;
    });
  }

  async getActiveExperiments(): Promise<Experiment[]> {
    return this.execute("getActiveExperiments", async () => {
      const experiments = await this.database.experiments
        .where("status")
        .equals("active")
        .toArray();

      return experiments
        .map((experiment) => experimentSchema.parse(experiment))
        .sort((a, b) => a.endDate.localeCompare(b.endDate));
    });
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return this.execute("getAllExperiments", async () => {
      const experiments = await this.database.experiments.toArray();

      return experiments
        .map((experiment) => experimentSchema.parse(experiment))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  async updateStatus(
    id: string,
    status: ExperimentStatus
  ): Promise<Experiment> {
    return this.execute("updateStatus", async () => {
      const existing = await this.database.experiments.get(id);
      if (!existing) {
        throw new Error("Experiment not found");
      }

      const updated = experimentSchema.parse({
        ...existing,
        status,
        updatedAt: nowIso(),
      });

      await this.database.experiments.put(updated);
      return updated;
    });
  }

  async addLog(input: AddExperimentLogInput): Promise<ExperimentLog> {
    return this.execute("addLog", async () => {
      const existing = await this.database.experimentLogs
        .where("[experimentId+date]")
        .equals([input.experimentId, input.date])
        .first();

      const log = experimentLogSchema.parse({
        ...input,
        id: existing?.id ?? createId(),
        createdAt: existing?.createdAt ?? nowIso(),
      });

      await this.database.experimentLogs.put(log);
      return log;
    });
  }

  async getLogsForExperiment(experimentId: string): Promise<ExperimentLog[]> {
    return this.execute("getLogsForExperiment", async () => {
      const logs = await this.database.experimentLogs
        .where("experimentId")
        .equals(experimentId)
        .toArray();

      return logs
        .map((log) => experimentLogSchema.parse(log))
        .sort((a, b) => a.date.localeCompare(b.date));
    });
  }
}
