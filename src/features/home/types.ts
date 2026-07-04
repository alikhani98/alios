import type {
  DailyCheckin,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
} from "@/shared/types";

export type HomeDashboardData = {
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
  isEmpty: boolean;
};
