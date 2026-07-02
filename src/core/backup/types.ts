import type {
  DailyCheckin,
  JournalEntry,
  KnowledgeItem,
  Project,
  Setting,
  Task,
} from "@/shared/types";

export type AliosBackup = {
  app: "AliOS";
  backupVersion: 1;
  exportedAt: string;
  data: {
    dailyCheckins: DailyCheckin[];
    tasks: Task[];
    projects: Project[];
    journalEntries: JournalEntry[];
    knowledgeItems: KnowledgeItem[];
    settings: Setting[];
  };
};
