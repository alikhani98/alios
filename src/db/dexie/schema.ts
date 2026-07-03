export const DEXIE_DATABASE_NAME = "AliOS";
export const DEXIE_SCHEMA_VERSION = 1;

export const DEXIE_TABLE_NAMES = {
  dailyCheckins: "dailyCheckins",
  tasks: "tasks",
  projects: "projects",
  journalEntries: "journalEntries",
  knowledgeItems: "knowledgeItems",
  settings: "settings",
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
} satisfies Record<DexieTableName, string>;
