import type {
  MoneyPause,
  MoneyPauseCurrency,
  MoneyPauseDecision,
  MoneyPauseReason,
} from "@/shared/types";

export type AddMoneyPauseInput = {
  item: string;
  amount: number;
  currency?: MoneyPauseCurrency;
  reason: MoneyPauseReason;
};

export interface MoneyPauseRepository {
  addPause(data: AddMoneyPauseInput): Promise<void>;
  getPendingPauses(): Promise<MoneyPause[]>;
  decide(id: string, decision: MoneyPauseDecision): Promise<void>;
  getRecentPauses(days: number): Promise<MoneyPause[]>;
}
