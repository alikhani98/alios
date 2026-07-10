import type { StorageAdapter } from "@/core/storage";
import { DexieBackupStorage } from "./DexieBackupStorage";
import { aliosDatabase, type AliosDatabase } from "./db";
import {
  DexieDailyCheckinsRepository,
  DexieDecisionLogRepository,
  DexieFinanceRepository,
  DexieJournalRepository,
  DexieInboxRepository,
  DexieKnowledgeRepository,
  DexieManualRepository,
  DexieProjectsRepository,
  DexieSettingsRepository,
  DexieTasksRepository,
} from "./repositories";

export class DexieStorageAdapter implements StorageAdapter {
  readonly backup: DexieBackupStorage;
  readonly inbox: DexieInboxRepository;
  readonly dailyCheckins: DexieDailyCheckinsRepository;
  readonly tasks: DexieTasksRepository;
  readonly decisions: DexieDecisionLogRepository;
  readonly finance: DexieFinanceRepository;
  readonly manual: DexieManualRepository;
  readonly projects: DexieProjectsRepository;
  readonly journal: DexieJournalRepository;
  readonly knowledge: DexieKnowledgeRepository;
  readonly settings: DexieSettingsRepository;

  constructor(readonly database: AliosDatabase = aliosDatabase) {
    this.backup = new DexieBackupStorage(database);
    this.inbox = new DexieInboxRepository(database);
    this.dailyCheckins = new DexieDailyCheckinsRepository(database);
    this.tasks = new DexieTasksRepository(database);
    this.decisions = new DexieDecisionLogRepository(database);
    this.finance = new DexieFinanceRepository(database);
    this.manual = new DexieManualRepository(database);
    this.projects = new DexieProjectsRepository(database);
    this.journal = new DexieJournalRepository(database);
    this.knowledge = new DexieKnowledgeRepository(database);
    this.settings = new DexieSettingsRepository(database);
  }
}

export const dexieStorageAdapter = new DexieStorageAdapter();
