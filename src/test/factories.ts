import type {
  CreateDailyCheckinInput,
  CreateDecisionLogEntryInput,
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  CreateJournalEntryInput,
  CreateInboxItemInput,
  CreateKnowledgeItemInput,
  CreateProjectInput,
  CreateSettingInput,
  CreateTaskInput,
} from "@/core/repositories";
import type {
  DailyCheckin,
  DecisionLogEntry,
  FinanceObligation,
  FinanceTransaction,
  JournalEntry,
  InboxItem,
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

export const inboxItemInput: CreateInboxItemInput = {
  content: "Capture the release idea",
  type: "idea",
};

export const financeTransactionInput: CreateFinanceTransactionInput = {
  type: "income",
  title: "Monthly salary",
  amount: 5000,
  category: "salary",
  occurredAt: "2026-07-05",
  notes: "Primary local income",
};

export const financeObligationInput: CreateFinanceObligationInput = {
  type: "installment",
  title: "Phone installment",
  totalAmount: 2400,
  paidAmount: 600,
  dueAmount: 400,
  monthlyAmount: 400,
  dueDay: 12,
  dueDate: "2026-07-12",
  counterparty: "Vendor",
  status: "active",
  notes: "Monthly installment for the phone",
};

export const decisionLogInput: CreateDecisionLogEntryInput = {
  title: "Choose release focus",
  decisionDate: "2026-07-05",
  status: "open",
  category: "release",
  context: "We need to decide whether to prioritize review polish or dashboard tweaks.",
  options: [
    "Ship Decision Log foundation",
    "Polish weekly review first",
  ],
  chosenOption: "Ship Decision Log foundation",
  reasoning: "The new decision module supports the next stage of personal operating system work.",
  expectedOutcome: "A practical local place to capture and revisit important decisions.",
  reviewDate: "2026-07-08",
  actualOutcome: "The feature shipped successfully.",
  lesson: "Keeping the form focused made the page much easier to use.",
  confidence: 4,
  importance: 5,
  tags: ["release", "product"],
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
export const inboxItemRecord: InboxItem = {
  ...inboxItemInput,
  status: "unprocessed",
  ...metadata,
};
export const financeTransactionRecord: FinanceTransaction = {
  ...financeTransactionInput,
  ...metadata,
};
export const financeObligationRecord: FinanceObligation = {
  ...financeObligationInput,
  ...metadata,
};
export const decisionLogRecord: DecisionLogEntry = {
  ...decisionLogInput,
  ...metadata,
};
