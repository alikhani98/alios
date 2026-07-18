import type {
  CreateDailyCheckinInput,
  CreateDecisionLogEntryInput,
  CreateGoalInput,
  CreateFinanceObligationInput,
  CreateFinanceTransactionInput,
  CreateJournalEntryInput,
  CreateInboxItemInput,
  CreateKnowledgeItemInput,
  CreateLifeAreaInput,
  CreateManualEntryInput,
  CreateProjectInput,
  CreateSettingInput,
  CreateTaskInput,
  CreateRoutineInput,
} from "@/core/repositories";
import type {
  DailyCheckin,
  DecisionLogEntry,
  Goal,
  FinanceObligation,
  FinanceTransaction,
  JournalEntry,
  InboxItem,
  KnowledgeItem,
  ManualEntry,
  LifeArea,
  Project,
  Setting,
  Task,
  Routine,
} from "@/shared/types";

const timestamp = "2026-07-05T08:30:00.000Z";

export const projectInput: CreateProjectInput = {
  title: "Ship AliOS",
  description: "Prepare the local-first release",
  status: "active",
  priority: "high",
  goalId: "fixture-id",
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
  projectId: "fixture-id",
};

export const routineInput: CreateRoutineInput = {
  title: "Morning review",
  description: "Review the day before planning",
  weekdays: [1, 2, 3, 4, 5],
  priority: "medium",
  isActive: true,
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

export const goalInput: CreateGoalInput = {
  title: "Improve sleep",
  description: "Keep a regular bedtime and morning routine.",
  area: "health",
  timeframe: "quarter",
  status: "active",
  importance: "high",
  progressPercent: 35,
  targetDate: "2026-09-30",
  reviewIntervalDays: 7,
  tags: ["health", "routine"],
};

export const lifeAreaInput: CreateLifeAreaInput = {
  areaKey: "health",
  title: "Health balance",
  description: "Keep a calm view of health routines and attention.",
  status: "active",
  attentionLevel: "high",
  satisfactionScore: 4,
  focusNote: "Revisit sleep, movement, and hydration.",
  reviewIntervalDays: 7,
  tags: ["wellness", "routine"],
};

export const manualEntryInput: Omit<
  CreateManualEntryInput,
  "lastReviewedAt"
> = {
  title: "Personal planning rule",
  body: "Keep the next action small and local when energy is low.",
  category: "principles",
  importance: "high",
  status: "active",
  tags: ["planning", "energy"],
  reviewIntervalDays: 7,
};

const metadata = {
  id: "fixture-id",
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const projectRecord: Project = { ...projectInput, ...metadata };
export const taskRecord: Task = { ...taskInput, ...metadata };
export const routineRecord: Routine = { ...routineInput, ...metadata };
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
export const goalRecord: Goal = {
  ...goalInput,
  ...metadata,
};
export const lifeAreaRecord: LifeArea = {
  id: lifeAreaInput.areaKey,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastReviewedAt: "2026-07-04T08:30:00.000Z",
  ...lifeAreaInput,
};
export const manualEntryRecord: ManualEntry = {
  ...manualEntryInput,
  lastReviewedAt: "2026-07-04T08:30:00.000Z",
  ...metadata,
};
