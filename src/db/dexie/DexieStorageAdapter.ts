import type { StorageAdapter } from "@/core/storage";
import { aliosDatabase, type AliosDatabase } from "./db";
import {
  DexieDailyCheckinsRepository,
  DexieJournalRepository,
  DexieKnowledgeRepository,
  DexieProjectsRepository,
  DexieSettingsRepository,
  DexieTasksRepository,
} from "./repositories";

export class DexieStorageAdapter implements StorageAdapter {
  readonly dailyCheckins: DexieDailyCheckinsRepository;
  readonly tasks: DexieTasksRepository;
  readonly projects: DexieProjectsRepository;
  readonly journal: DexieJournalRepository;
  readonly knowledge: DexieKnowledgeRepository;
  readonly settings: DexieSettingsRepository;

  constructor(readonly database: AliosDatabase = aliosDatabase) {
    this.dailyCheckins = new DexieDailyCheckinsRepository(database);
    this.tasks = new DexieTasksRepository(database);
    this.projects = new DexieProjectsRepository(database);
    this.journal = new DexieJournalRepository(database);
    this.knowledge = new DexieKnowledgeRepository(database);
    this.settings = new DexieSettingsRepository(database);
  }
}

export const dexieStorageAdapter = new DexieStorageAdapter();
