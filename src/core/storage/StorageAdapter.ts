import type {
  DailyCheckinsRepository,
  DecisionLogRepository,
  GoalsRepository,
  FinanceRepository,
  FocusSessionsRepository,
  JournalRepository,
  LifeAreasRepository,
  ManualRepository,
  InboxRepository,
  KnowledgeRepository,
  ProjectsRepository,
  SettingsRepository,
  TasksRepository,
  RoutinesRepository,
  WeeklyPlansRepository,
} from "@/core/repositories";
import type { BackupStorage } from "@/core/backup";

export interface StorageAdapter {
  backup: BackupStorage;
  inbox: InboxRepository;
  dailyCheckins: DailyCheckinsRepository;
  tasks: TasksRepository;
  routines: RoutinesRepository;
  weeklyPlans: WeeklyPlansRepository;
  decisions: DecisionLogRepository;
  goals: GoalsRepository;
  finance: FinanceRepository;
  focusSessions: FocusSessionsRepository;
  lifeAreas: LifeAreasRepository;
  manual: ManualRepository;
  projects: ProjectsRepository;
  journal: JournalRepository;
  knowledge: KnowledgeRepository;
  settings: SettingsRepository;
}
