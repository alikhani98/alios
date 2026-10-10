import Dexie, { type Table } from "dexie";

import type { MutationOutboxEntry } from "@/core/sync/mutationOutbox";
import type {
  DailyCheckin,
  DailyCommitment,
  Attachment,
  DecisionLogEntry,
  Experiment,
  ExperimentLog,
  IfThenPlan,
  MoneyPause,
  TherapyNote,
  UrgeEntry,
  Goal,
  FinanceAsset,
  FinanceObligation,
  FinanceCategoryBudget,
  FinanceTransaction,
  FocusSession,
  JournalEntry,
  LifeArea,
  InboxItem,
  KnowledgeItem,
  ManualEntry,
  Project,
  Resource,
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
  DEXIE_SCHEMA_V11,
  DEXIE_SCHEMA_V12,
  DEXIE_SCHEMA_V13,
  DEXIE_SCHEMA_V14,
  DEXIE_SCHEMA_V15,
  DEXIE_SCHEMA_V16,
  DEXIE_SCHEMA_V17,
  DEXIE_SCHEMA_V18,
  DEXIE_SCHEMA_V19,
  DEXIE_SCHEMA_V20,
  DEXIE_SCHEMA_V21,
  DEXIE_SCHEMA_V22,
  DEXIE_SCHEMA_V23,
  DEXIE_SCHEMA_VERSION,
  DEXIE_SCHEMA_VERSION_3,
  DEXIE_SCHEMA_VERSION_4,
  DEXIE_SCHEMA_VERSION_5,
  DEXIE_SCHEMA_VERSION_6,
  DEXIE_SCHEMA_VERSION_7,
  DEXIE_SCHEMA_VERSION_8,
  DEXIE_SCHEMA_VERSION_9,
  DEXIE_SCHEMA_VERSION_10,
  DEXIE_SCHEMA_VERSION_11,
  DEXIE_SCHEMA_VERSION_12,
  DEXIE_SCHEMA_VERSION_13,
  DEXIE_SCHEMA_VERSION_14,
  DEXIE_SCHEMA_VERSION_15,
  DEXIE_SCHEMA_VERSION_16,
  DEXIE_SCHEMA_VERSION_17,
  DEXIE_SCHEMA_VERSION_18,
  DEXIE_SCHEMA_VERSION_19,
  DEXIE_SCHEMA_VERSION_20,
  DEXIE_SCHEMA_VERSION_21,
  DEXIE_SCHEMA_VERSION_22,
  DEXIE_SCHEMA_VERSION_23,
} from "./schema";

export class AliosDatabase extends Dexie {
  dailyCheckins!: Table<DailyCheckin, string>;
  dailyCommitments!: Table<DailyCommitment, string>;
  urgeEntries!: Table<UrgeEntry, string>;
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
  financeCategoryBudgets!: Table<FinanceCategoryBudget, string>;
  financeAssets!: Table<FinanceAsset, string>;
  routines!: Table<Routine, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  focusSessions!: Table<FocusSession, string>;
  resources!: Table<Resource, string>;
  experiments!: Table<Experiment, string>;
  experimentLogs!: Table<ExperimentLog, string>;
  ifThenPlans!: Table<IfThenPlan, string>;
  moneyPauses!: Table<MoneyPause, string>;
  therapyNotes!: Table<TherapyNote, string>;
  attachments!: Table<Attachment, string>;
  attachmentBlobs!: Table<{ storageKey: string; blob: Blob }, string>;
  mutationOutbox!: Table<MutationOutboxEntry, string>;

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
    this.version(DEXIE_SCHEMA_VERSION_11).stores(DEXIE_SCHEMA_V11);
    this.version(DEXIE_SCHEMA_VERSION_12).stores(DEXIE_SCHEMA_V12);
    this.version(DEXIE_SCHEMA_VERSION_13).stores(DEXIE_SCHEMA_V13);
    this.version(DEXIE_SCHEMA_VERSION_14).stores(DEXIE_SCHEMA_V14);
    this.version(DEXIE_SCHEMA_VERSION_15).stores(DEXIE_SCHEMA_V15);
    this.version(DEXIE_SCHEMA_VERSION_16).stores(DEXIE_SCHEMA_V16);
    this.version(DEXIE_SCHEMA_VERSION_17).stores(DEXIE_SCHEMA_V17);
    this.version(DEXIE_SCHEMA_VERSION_18).stores(DEXIE_SCHEMA_V18);
    this.version(DEXIE_SCHEMA_VERSION_19)
      .stores(DEXIE_SCHEMA_V19)
      .upgrade(async (tx) => {
        await tx.table("tasks").where("status").equals("pending").modify({
          status: "todo",
        });
      });
    this.version(DEXIE_SCHEMA_VERSION_20).stores(DEXIE_SCHEMA_V20);
    this.version(DEXIE_SCHEMA_VERSION_21).stores(DEXIE_SCHEMA_V21);
    this.version(DEXIE_SCHEMA_VERSION_22).stores(DEXIE_SCHEMA_V22);
    this.version(DEXIE_SCHEMA_VERSION_23).stores(DEXIE_SCHEMA_V23);
  }
}

export const aliosDatabase = new AliosDatabase();
