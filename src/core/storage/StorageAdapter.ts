import type {
  DailyCheckinsRepository,
  DailyCommitmentsRepository,
  DecisionLogRepository,
  ExperimentRepository,
  IfThenRepository,
  MoneyPauseRepository,
  TherapyNoteRepository,
  UrgeRepository,
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
import type { MutationOutboxRepository } from "@/core/sync/mutationOutbox";
import type { BinaryStorage } from "./BinaryStorage";

export interface StorageAdapter {
  backup: BackupStorage;
  mutationOutbox?: MutationOutboxRepository;
  inbox: InboxRepository;
  dailyCheckins: DailyCheckinsRepository;
  dailyCommitments: DailyCommitmentsRepository;
  urgeEntries: UrgeRepository;
  tasks: TasksRepository;
  routines: RoutinesRepository;
  weeklyPlans: WeeklyPlansRepository;
  decisions: DecisionLogRepository;
  experiments: ExperimentRepository;
  ifThenPlans: IfThenRepository;
  moneyPauses: MoneyPauseRepository;
  therapyNotes: TherapyNoteRepository;
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
