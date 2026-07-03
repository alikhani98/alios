import type {
  DailyCheckinsRepository,
  JournalRepository,
  KnowledgeRepository,
  ProjectsRepository,
  SettingsRepository,
  TasksRepository,
} from "@/core/repositories";
import type { BackupStorage } from "@/core/backup";

export interface StorageAdapter {
  backup: BackupStorage;
  dailyCheckins: DailyCheckinsRepository;
  tasks: TasksRepository;
  projects: ProjectsRepository;
  journal: JournalRepository;
  knowledge: KnowledgeRepository;
  settings: SettingsRepository;
}
