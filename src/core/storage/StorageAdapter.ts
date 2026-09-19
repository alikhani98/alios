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
  ResourceRepository,
  ProjectsRepository,
  SettingsRepository,
  TasksRepository,
  RoutinesRepository,
  WeeklyPlansRepository,
  AttachmentRepository,
} from "@/core/repositories";
import type { BackupStorage } from "@/core/backup";
import type { BinaryStorage } from "./BinaryStorage";

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
  resources: ResourceRepository;
  settings: SettingsRepository;
  attachments: AttachmentRepository;
  attachmentBinary: BinaryStorage;
}
