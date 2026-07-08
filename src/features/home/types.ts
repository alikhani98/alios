import type {
  DailyCheckin,
  JournalEntry,
  KnowledgeItem,
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
  inbox: {
    unprocessedCount: number;
  };
  isEmpty: boolean;
};
