import type { StorageAdapter } from "@/core/storage";
import { DEXIE_TABLE_NAMES } from "@/db/dexie/schema";

export type SyncableRepositoryKey = Exclude<keyof StorageAdapter, "backup">;

export type SyncableEntityName =
  | "dailyCheckins"
  | "tasks"
  | "projects"
  | "journalEntries"
  | "knowledgeItems"
  | "settings"
  | "inboxItems"
  | "financeTransactions"
  | "financeObligations"
  | "decisionLogEntries"
  | "manualEntries"
  | "goals"
  | "lifeAreas"
  | "routines"
  | "weeklyPlans";

export type SyncableEntityDescriptor = Readonly<{
  entity: SyncableEntityName;
  repository: SyncableRepositoryKey;
  dexieTable: string;
  backupField: string;
  notes: string;
}>;

/**
 * Repository-backed records that could participate in a future optional sync adapter.
 *
 * This catalog is documentation in code. It does not activate sync, mutate storage,
 * or change the current local-only runtime behavior.
 */
export const SYNCABLE_ENTITY_CATALOG = [
  {
    entity: "dailyCheckins",
    repository: "dailyCheckins",
    dexieTable: DEXIE_TABLE_NAMES.dailyCheckins,
    backupField: "dailyCheckins",
    notes: "Date-keyed daily reflection and MIT linkage records.",
  },
  {
    entity: "tasks",
    repository: "tasks",
    dexieTable: DEXIE_TABLE_NAMES.tasks,
    backupField: "tasks",
    notes: "Today task records, including project and routine links.",
  },
  {
    entity: "projects",
    repository: "projects",
    dexieTable: DEXIE_TABLE_NAMES.projects,
    backupField: "projects",
    notes: "Project planning records with optional goal links.",
  },
  {
    entity: "journalEntries",
    repository: "journal",
    dexieTable: DEXIE_TABLE_NAMES.journalEntries,
    backupField: "journalEntries",
    notes: "Journal capture records stored through the journal repository.",
  },
  {
    entity: "knowledgeItems",
    repository: "knowledge",
    dexieTable: DEXIE_TABLE_NAMES.knowledgeItems,
    backupField: "knowledgeItems",
    notes: "Knowledge base records stored through the knowledge repository.",
  },
  {
    entity: "settings",
    repository: "settings",
    dexieTable: DEXIE_TABLE_NAMES.settings,
    backupField: "settings",
    notes: "Repository-owned settings records stored in IndexedDB.",
  },
  {
    entity: "inboxItems",
    repository: "inbox",
    dexieTable: DEXIE_TABLE_NAMES.inboxItems,
    backupField: "inboxItems",
    notes: "Inbox capture and triage records.",
  },
  {
    entity: "financeTransactions",
    repository: "finance",
    dexieTable: DEXIE_TABLE_NAMES.financeTransactions,
    backupField: "financeTransactions",
    notes: "Finance transaction records exposed through the finance repository.",
  },
  {
    entity: "financeObligations",
    repository: "finance",
    dexieTable: DEXIE_TABLE_NAMES.financeObligations,
    backupField: "financeObligations",
    notes: "Finance obligation records exposed through the finance repository.",
  },
  {
    entity: "decisionLogEntries",
    repository: "decisions",
    dexieTable: DEXIE_TABLE_NAMES.decisionLogEntries,
    backupField: "decisionLogEntries",
    notes: "Decision history and review records.",
  },
  {
    entity: "manualEntries",
    repository: "manual",
    dexieTable: DEXIE_TABLE_NAMES.manualEntries,
    backupField: "manualEntries",
    notes: "Personal Manual knowledge records.",
  },
  {
    entity: "goals",
    repository: "goals",
    dexieTable: DEXIE_TABLE_NAMES.goals,
    backupField: "goals",
    notes: "Goal tracking records with review timing and progress.",
  },
  {
    entity: "lifeAreas",
    repository: "lifeAreas",
    dexieTable: DEXIE_TABLE_NAMES.lifeAreas,
    backupField: "lifeAreas",
    notes: "Life Area records keyed by canonical area identity.",
  },
  {
    entity: "routines",
    repository: "routines",
    dexieTable: DEXIE_TABLE_NAMES.routines,
    backupField: "routines",
    notes: "Recurring routine definitions used to create explicit tasks.",
  },
  {
    entity: "weeklyPlans",
    repository: "weeklyPlans",
    dexieTable: DEXIE_TABLE_NAMES.weeklyPlans,
    backupField: "weeklyPlans",
    notes: "Weekly planning records keyed by the week start date.",
  },
] as const satisfies ReadonlyArray<SyncableEntityDescriptor>;

export const SYNCABLE_ENTITY_NAMES = SYNCABLE_ENTITY_CATALOG.map(
  (entry) => entry.entity
) as ReadonlyArray<SyncableEntityName>;
