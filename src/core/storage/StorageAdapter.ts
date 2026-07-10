import type {
  DailyCheckinsRepository,
  DecisionLogRepository,
  FinanceRepository,
  JournalRepository,
  ManualRepository,
  InboxRepository,
  KnowledgeRepository,
  ProjectsRepository,
  SettingsRepository,
  TasksRepository,
} from "@/core/repositories";
import type { BackupStorage } from "@/core/backup";

export interface StorageAdapter {
  backup: BackupStorage;
  inbox: InboxRepository;
  dailyCheckins: DailyCheckinsRepository;
  tasks: TasksRepository;
  decisions: DecisionLogRepository;
  finance: FinanceRepository;
  manual: ManualRepository;
  projects: ProjectsRepository;
  journal: JournalRepository;
  knowledge: KnowledgeRepository;
  settings: SettingsRepository;
}
