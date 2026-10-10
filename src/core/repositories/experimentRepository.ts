import type {
  Experiment,
  ExperimentLog,
  ExperimentStatus,
} from "@/shared/types";

export type CreateExperimentInput = Pick<
  Experiment,
  "title" | "ifCondition" | "thenHypothesis" | "startDate"
>;

export type AddExperimentLogInput = Omit<ExperimentLog, "id" | "createdAt">;

export interface ExperimentRepository {
  createExperiment(input: CreateExperimentInput): Promise<Experiment>;
  getActiveExperiments(): Promise<Experiment[]>;
  getAllExperiments(): Promise<Experiment[]>;
  updateStatus(id: string, status: ExperimentStatus): Promise<Experiment>;
  addLog(input: AddExperimentLogInput): Promise<ExperimentLog>;
  getLogsForExperiment(experimentId: string): Promise<ExperimentLog[]>;
}
