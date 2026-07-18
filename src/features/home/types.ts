import type {
  DailyCheckin,
  Goal,
  JournalEntry,
  KnowledgeItem,
  ManualEntry,
  Project,
  Task,
  WeeklyPlan,
} from "@/shared/types";
import type { LifeAreaView } from "@/features/lifeAreas";
import type { HomePlanningFocus } from "./homePlanningFocus";
import type { WeeklyPlanLink } from "@/features/weeklyReview/weeklyPlanLinks";

export type HomeDashboardData = {
  tasks: Task[];
  today: {
    tasks: Task[];
    completedTaskCount: number;
    mitTask?: Task;
    checkin?: DailyCheckin;
  };
  projects: {
    totalCount: number;
    activeCount: number;
    recent: Project[];
  };
  journal: {
    totalCount: number;
    latest?: JournalEntry;
  };
  knowledge: {
    totalCount: number;
    latest?: KnowledgeItem;
  };
  goals: {
    totalCount: number;
    activeCount: number;
    reviewDueCount: number;
    highImportanceActiveCount: number;
    averageActiveProgress: number | null;
    latest?: Goal;
  };
  lifeAreas: {
    totalCount: number;
    activeCount: number;
    highAttentionActiveCount: number;
    reviewDueCount: number;
    averageSatisfactionScore: number | null;
    latest?: LifeAreaView;
  };
  manual: {
    totalCount: number;
    activeCount: number;
    reviewDueCount: number;
    latest?: ManualEntry;
  };
  inbox: {
    unprocessedCount: number;
  };
  planningFocus?: HomePlanningFocus;
  weeklyPlan?: WeeklyPlan;
  weeklyPlanLinks?: WeeklyPlanLink[];
  isEmpty: boolean;
};
