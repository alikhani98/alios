import Dexie, { type Table } from "dexie";

import type {
  DailyCheckin,
  JournalEntry,
  InboxItem,
  KnowledgeItem,
  Project,
  Setting,
  Task,
} from "@/shared/types";
import {
  DEXIE_DATABASE_NAME,
  DEXIE_SCHEMA_V1,
  DEXIE_SCHEMA_V2,
  DEXIE_SCHEMA_VERSION,
} from "./schema";

export class AliosDatabase extends Dexie {
  dailyCheckins!: Table<DailyCheckin, string>;
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  journalEntries!: Table<JournalEntry, string>;
  knowledgeItems!: Table<KnowledgeItem, string>;
  settings!: Table<Setting, string>;
  inboxItems!: Table<InboxItem, string>;

  constructor() {
    super(DEXIE_DATABASE_NAME);
    this.version(1).stores(DEXIE_SCHEMA_V1);
    this.version(DEXIE_SCHEMA_VERSION).stores(DEXIE_SCHEMA_V2);
  }
}

export const aliosDatabase = new AliosDatabase();
