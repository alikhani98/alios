import type {
  DailyCheckinsRepository,
  JournalRepository,
  KnowledgeRepository,
  ProjectsRepository,
  SettingsRepository,
  TasksRepository,
} from "@/core/repositories";

export interface StorageAdapter {
  dailyCheckins: DailyCheckinsRepository;
  tasks: TasksRepository;
  projects: ProjectsRepository;
  journal: JournalRepository;
  knowledge: KnowledgeRepository;
  settings: SettingsRepository;
}
