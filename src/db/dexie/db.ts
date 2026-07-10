import Dexie, { type Table } from "dexie";

import type {
  DailyCheckin,
  DecisionLogEntry,
  FinanceObligation,
  FinanceTransaction,
  JournalEntry,
  InboxItem,
  KnowledgeItem,
  ManualEntry,
  Project,
  Setting,
  Task,
} from "@/shared/types";
import {
  DEXIE_DATABASE_NAME,
  DEXIE_SCHEMA_V1,
  DEXIE_SCHEMA_V2,
  DEXIE_SCHEMA_V3,
  DEXIE_SCHEMA_V4,
  DEXIE_SCHEMA_V5,
  DEXIE_SCHEMA_VERSION,
  DEXIE_SCHEMA_VERSION_3,
  DEXIE_SCHEMA_VERSION_4,
  DEXIE_SCHEMA_VERSION_5,
} from "./schema";

export class AliosDatabase extends Dexie {
  dailyCheckins!: Table<DailyCheckin, string>;
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  journalEntries!: Table<JournalEntry, string>;
  knowledgeItems!: Table<KnowledgeItem, string>;
  decisionLogEntries!: Table<DecisionLogEntry, string>;
  manualEntries!: Table<ManualEntry, string>;
  settings!: Table<Setting, string>;
  inboxItems!: Table<InboxItem, string>;
  financeTransactions!: Table<FinanceTransaction, string>;
  financeObligations!: Table<FinanceObligation, string>;

  constructor() {
    super(DEXIE_DATABASE_NAME);
    this.version(1).stores(DEXIE_SCHEMA_V1);
    this.version(DEXIE_SCHEMA_VERSION).stores(DEXIE_SCHEMA_V2);
    this.version(DEXIE_SCHEMA_VERSION_3).stores(DEXIE_SCHEMA_V3);
    this.version(DEXIE_SCHEMA_VERSION_4).stores(DEXIE_SCHEMA_V4);
    this.version(DEXIE_SCHEMA_VERSION_5).stores(DEXIE_SCHEMA_V5);
  }
}

export const aliosDatabase = new AliosDatabase();
