import type {
  LifeAreaAttentionLevel,
  LifeAreaStatus,
} from "@/shared/types";

export type LifeAreaFormValues = {
  title: string;
  description: string;
  status: LifeAreaStatus;
  attentionLevel: LifeAreaAttentionLevel;
  satisfactionScore: string;
  focusNote: string;
  reviewIntervalDays: string;
  tagsText: string;
};
