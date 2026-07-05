import type {
  CreateDailyCheckinInput,
  CreateJournalEntryInput,
  CreateKnowledgeItemInput,
  CreateProjectInput,
  CreateSettingInput,
  CreateTaskInput,
} from "@/core/repositories";
import type {
  DailyCheckin,
  JournalEntry,
  KnowledgeItem,
  Project,
  Setting,
  Task,
} from "@/shared/types";

const timestamp = "2026-07-05T08:30:00.000Z";

export const projectInput: CreateProjectInput = {
  title: "Ship AliOS",
  description: "Prepare the local-first release",
  status: "active",
  priority: "high",
  nextAction: "Run validation",
  reviewDate: "2026-07-06",
};

export const taskInput: CreateTaskInput = {
  title: "Validate data layer",
  description: "Run repository tests",
  status: "todo",
  priority: "high",
  dueDate: "2026-07-05",
  isMit: true,
};

export const journalEntryInput: CreateJournalEntryInput = {
  date: "2026-07-05",
  type: "learning",
  title: "Testing foundation",
  content: "Core data flows now have automated coverage.",
  moodLevel: "good",
  energyLevel: "medium",
};

export const knowledgeItemInput: CreateKnowledgeItemInput = {
  title: "Testing rule",
  type: "rule",
  summary: "Test current behavior before adding features.",
  content: "Prefer focused tests around approved architectural boundaries.",
  source: "AliOS architecture",
};

export const dailyCheckinInput: CreateDailyCheckinInput = {
  date: "2026-07-05",
  sleepQuality: "good",
  energyLevel: "medium",
  moodLevel: "good",
  stressLevel: "low",
  medicationDone: true,
  smokingStatus: "none",
  notes: "Ready to test.",
};

export const settingInput: CreateSettingInput = {
  key: "testing.enabled",
  value: true,
};

const metadata = {
  id: "fixture-id",
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const projectRecord: Project = { ...projectInput, ...metadata };
export const taskRecord: Task = { ...taskInput, ...metadata };
export const journalEntryRecord: JournalEntry = {
  ...journalEntryInput,
  ...metadata,
};
export const knowledgeItemRecord: KnowledgeItem = {
  ...knowledgeItemInput,
  ...metadata,
};
export const dailyCheckinRecord: DailyCheckin = {
  ...dailyCheckinInput,
  ...metadata,
};
export const settingRecord: Setting = { ...settingInput, ...metadata };
