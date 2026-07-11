export const DEXIE_DATABASE_NAME = "AliOS";
export const DEXIE_SCHEMA_VERSION = 2;
export const DEXIE_SCHEMA_VERSION_3 = 3;
export const DEXIE_SCHEMA_VERSION_4 = 4;
export const DEXIE_SCHEMA_VERSION_5 = 5;
export const DEXIE_SCHEMA_VERSION_6 = 6;

export const DEXIE_TABLE_NAMES = {
  dailyCheckins: "dailyCheckins",
  tasks: "tasks",
  projects: "projects",
  journalEntries: "journalEntries",
  knowledgeItems: "knowledgeItems",
  goals: "goals",
  decisionLogEntries: "decisionLogEntries",
  manualEntries: "manualEntries",
  settings: "settings",
  inboxItems: "inboxItems",
  financeTransactions: "financeTransactions",
  financeObligations: "financeObligations",
} as const;

export type DexieTableName =
  (typeof DEXIE_TABLE_NAMES)[keyof typeof DEXIE_TABLE_NAMES];

export const DEXIE_SCHEMA_V1 = {
  [DEXIE_TABLE_NAMES.dailyCheckins]: "id, &date, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.tasks]:
    "id, status, dueDate, projectId, isMit, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.projects]:
    "id, status, priority, reviewDate, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.journalEntries]:
    "id, date, type, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.knowledgeItems]:
    "id, type, title, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.settings]: "id, &key, createdAt, updatedAt",
} satisfies Partial<Record<DexieTableName, string>>;

export const DEXIE_SCHEMA_V2 = {
  ...DEXIE_SCHEMA_V1,
  [DEXIE_TABLE_NAMES.inboxItems]:
    "id, status, type, createdAt, updatedAt",
} satisfies Partial<Record<DexieTableName, string>>;

export const DEXIE_SCHEMA_V3 = {
  [DEXIE_TABLE_NAMES.dailyCheckins]: "id, &date, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.tasks]:
    "id, status, dueDate, projectId, isMit, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.projects]:
    "id, status, priority, reviewDate, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.journalEntries]:
    "id, date, type, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.knowledgeItems]:
    "id, type, title, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.settings]: "id, &key, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.inboxItems]:
    "id, status, type, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.financeTransactions]:
    "id, type, category, occurredAt, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.financeObligations]:
    "id, type, status, dueDate, dueDay, createdAt, updatedAt",
  [DEXIE_TABLE_NAMES.decisionLogEntries]:
    "id, decisionDate, status, reviewDate, updatedAt",
} satisfies Partial<Record<DexieTableName, string>>;

export const DEXIE_SCHEMA_V4 = {
  ...DEXIE_SCHEMA_V3,
} satisfies Partial<Record<DexieTableName, string>>;

export const DEXIE_SCHEMA_V5 = {
  ...DEXIE_SCHEMA_V4,
  [DEXIE_TABLE_NAMES.manualEntries]:
    "id, category, status, importance, reviewIntervalDays, updatedAt",
} satisfies Partial<Record<DexieTableName, string>>;

export const DEXIE_SCHEMA_V6 = {
  ...DEXIE_SCHEMA_V5,
  [DEXIE_TABLE_NAMES.goals]:
    "id, area, timeframe, status, importance, progressPercent, targetDate, reviewIntervalDays, updatedAt",
} satisfies Record<DexieTableName, string>;
