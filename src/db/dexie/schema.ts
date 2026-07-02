export const dexieSchemaVersion = 1;

export const dexieStores = {
  dailyCheckins: "id, date, createdAt, updatedAt",
  tasks: "id, status, dueDate, projectId, isMit, createdAt, updatedAt",
  projects: "id, status, priority, reviewDate, createdAt, updatedAt",
  journalEntries: "id, date, type, createdAt, updatedAt",
  knowledgeItems: "id, type, title, createdAt, updatedAt",
  settings: "id, key, createdAt, updatedAt",
} as const;
