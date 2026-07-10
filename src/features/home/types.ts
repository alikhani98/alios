import type {
  DailyCheckin,
  JournalEntry,
  KnowledgeItem,
  ManualEntry,
  Project,
  Task,
} from "@/shared/types";

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
  manual: {
    totalCount: number;
    activeCount: number;
    reviewDueCount: number;
    latest?: ManualEntry;
  };
  inbox: {
    unprocessedCount: number;
  };
  isEmpty: boolean;
};
