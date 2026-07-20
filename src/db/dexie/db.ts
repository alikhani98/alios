import Dexie, { type Table } from "dexie";

import type {
  DailyCheckin,
  DecisionLogEntry,
  Goal,
  FinanceObligation,
  FinanceTransaction,
  JournalEntry,
  LifeArea,
  InboxItem,
  KnowledgeItem,
  ManualEntry,
  Project,
  Setting,
  Task,
  Routine,
  WeeklyPlan,
} from "@/shared/types";
import {
  DEXIE_DATABASE_NAME,
  DEXIE_SCHEMA_V1,
  DEXIE_SCHEMA_V2,
  DEXIE_SCHEMA_V3,
  DEXIE_SCHEMA_V4,
  DEXIE_SCHEMA_V5,
  DEXIE_SCHEMA_V6,
  DEXIE_SCHEMA_V7,
  DEXIE_SCHEMA_V8,
  DEXIE_SCHEMA_V9,
  DEXIE_SCHEMA_V10,
  DEXIE_SCHEMA_VERSION,
  DEXIE_SCHEMA_VERSION_3,
  DEXIE_SCHEMA_VERSION_4,
  DEXIE_SCHEMA_VERSION_5,
  DEXIE_SCHEMA_VERSION_6,
  DEXIE_SCHEMA_VERSION_7,
  DEXIE_SCHEMA_VERSION_8,
  DEXIE_SCHEMA_VERSION_9,
  DEXIE_SCHEMA_VERSION_10,
} from "./schema";

export class AliosDatabase extends Dexie {
  dailyCheckins!: Table<DailyCheckin, string>;
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  journalEntries!: Table<JournalEntry, string>;
  knowledgeItems!: Table<KnowledgeItem, string>;
  decisionLogEntries!: Table<DecisionLogEntry, string>;
  goals!: Table<Goal, string>;
  lifeAreas!: Table<LifeArea, string>;
  manualEntries!: Table<ManualEntry, string>;
  settings!: Table<Setting, string>;
  inboxItems!: Table<InboxItem, string>;
  financeTransactions!: Table<FinanceTransaction, string>;
  financeObligations!: Table<FinanceObligation, string>;
  routines!: Table<Routine, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;

  constructor() {
    super(DEXIE_DATABASE_NAME);
    this.version(1).stores(DEXIE_SCHEMA_V1);
    this.version(DEXIE_SCHEMA_VERSION).stores(DEXIE_SCHEMA_V2);
    this.version(DEXIE_SCHEMA_VERSION_3).stores(DEXIE_SCHEMA_V3);
    this.version(DEXIE_SCHEMA_VERSION_4).stores(DEXIE_SCHEMA_V4);
    this.version(DEXIE_SCHEMA_VERSION_5).stores(DEXIE_SCHEMA_V5);
    this.version(DEXIE_SCHEMA_VERSION_6).stores(DEXIE_SCHEMA_V6);
    this.version(DEXIE_SCHEMA_VERSION_7).stores(DEXIE_SCHEMA_V7);
    this.version(DEXIE_SCHEMA_VERSION_8).stores(DEXIE_SCHEMA_V8);
    this.version(DEXIE_SCHEMA_VERSION_9).stores(DEXIE_SCHEMA_V9);
    this.version(DEXIE_SCHEMA_VERSION_10).stores(DEXIE_SCHEMA_V10);
  }
}

export const aliosDatabase = new AliosDatabase();
