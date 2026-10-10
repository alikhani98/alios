import type { DailyCommitment } from "@/shared/types";

export type UpsertDailyCommitmentInput = Omit<
  DailyCommitment,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export type DailyCommitmentReflectionInput = Pick<
  DailyCommitment,
  "preStartFeeling" | "mainBlocker" | "endOfDayNote"
>;

export interface DailyCommitmentsRepository {
  getTodayCommitment(): Promise<DailyCommitment | undefined>;
  getCommitmentByDate(date: string): Promise<DailyCommitment | undefined>;
  upsertCommitment(data: UpsertDailyCommitmentInput): Promise<void>;
  markStarted(date: string): Promise<void>;
  saveEveningReflection(
    date: string,
    fields: DailyCommitmentReflectionInput
  ): Promise<void>;
  getRecentCommitments(days: number): Promise<DailyCommitment[]>;
}
