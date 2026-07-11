import type {
  DecisionLogEntry,
  Goal,
  FinanceObligation,
  FinanceTransaction,
  JournalEntry,
  KnowledgeItem,
  ManualEntry,
} from "@/shared/types";

export type ExportCenterAction =
  | "finance"
  | "decisionLog"
  | "goals"
  | "journal"
  | "knowledge"
  | "manual";

const CSV_HEADER = [
  "recordType",
  "id",
  "title",
  "date",
  "entryType",
  "category",
  "amount",
  "totalAmount",
  "paidAmount",
  "dueAmount",
  "monthlyAmount",
  "dueDay",
  "dueDate",
  "counterparty",
  "status",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

function escapeCsvValue(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function toCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return escapeCsvValue(String(value));
}

function createCsvContent(
  headers: readonly string[],
  rows: Array<Record<string, string | number | boolean | null | undefined>>
): string {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => toCsvValue(row[header])).join(","))].join("\n");
}

function formatList(items: string[], emptyLabel: string): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${emptyLabel}`;
}

function formatBlock(value: string | undefined, emptyLabel: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return `> ${emptyLabel}`;
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

export function createReadableExportFilename(
  slug: string,
  extension: "csv" | "md",
  date = new Date()
): string {
  const stamp = date.toISOString().slice(0, 16).replace("T", "-").replace(/:/g, "-");
  return `alios-${slug}-export-${stamp}.${extension}`;
}

export function createFinanceCsvExport(
  transactions: FinanceTransaction[],
  obligations: FinanceObligation[]
): string {
  const rows = [
    ...transactions.map((transaction) => ({
      recordType: "transaction",
      id: transaction.id,
      title: transaction.title,
      date: transaction.occurredAt,
      entryType: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      totalAmount: "",
      paidAmount: "",
      dueAmount: "",
      monthlyAmount: "",
      dueDay: "",
      dueDate: "",
      counterparty: "",
      status: "",
      notes: transaction.notes ?? "",
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })),
    ...obligations.map((obligation) => ({
      recordType: "obligation",
      id: obligation.id,
      title: obligation.title,
      date: obligation.dueDate ?? "",
      entryType: obligation.type,
      category: "",
      amount: "",
      totalAmount: obligation.totalAmount,
      paidAmount: obligation.paidAmount,
      dueAmount: obligation.dueAmount ?? "",
      monthlyAmount: obligation.monthlyAmount ?? "",
      dueDay: obligation.dueDay ?? "",
      dueDate: obligation.dueDate ?? "",
      counterparty: obligation.counterparty ?? "",
      status: obligation.status,
      notes: obligation.notes ?? "",
      createdAt: obligation.createdAt,
      updatedAt: obligation.updatedAt,
    })),
  ];

  return createCsvContent(CSV_HEADER, rows);
}

export function createDecisionLogMarkdownExport(entries: DecisionLogEntry[]): string {
  const lines = [
    "# AliOS Decision Log Export",
    "",
    `Exported at: ${new Date().toISOString()}`,
    `Entries: ${entries.length}`,
    "",
  ];

  if (entries.length === 0) {
    lines.push("No decision log entries were recorded yet.");
    return lines.join("\n");
  }

  for (const entry of entries) {
    lines.push(
      `## ${entry.title}`,
      "",
      `- Decision date: ${entry.decisionDate}`,
      `- Status: ${entry.status}`,
      `- Category: ${entry.category ?? "Not recorded"}`,
      `- Review date: ${entry.reviewDate ?? "Not recorded"}`,
      `- Confidence: ${entry.confidence ?? "Not recorded"}`,
      `- Importance: ${entry.importance ?? "Not recorded"}`,
      `- Tags: ${entry.tags.length > 0 ? entry.tags.join(", ") : "Not recorded"}`,
      `- Options:\n${formatList(entry.options, "Not recorded")}`,
      `- Chosen option: ${entry.chosenOption ?? "Not recorded"}`,
      `- Reasoning:\n${formatBlock(entry.reasoning, "Not recorded")}`,
      `- Expected outcome:\n${formatBlock(entry.expectedOutcome, "Not recorded")}`,
      `- Actual outcome:\n${formatBlock(entry.actualOutcome, "Not recorded")}`,
      `- Lesson:\n${formatBlock(entry.lesson, "Not recorded")}`,
      `- Context:\n${formatBlock(entry.context, "Not recorded")}`,
      `- Created at: ${entry.createdAt}`,
      `- Updated at: ${entry.updatedAt}`,
      ""
    );
  }

  return lines.join("\n").trimEnd();
}

export function createGoalsMarkdownExport(entries: Goal[]): string {
  const lines = [
    "# AliOS Goals Export",
    "",
    `Exported at: ${new Date().toISOString()}`,
    `Entries: ${entries.length}`,
    "",
  ];

  if (entries.length === 0) {
    lines.push("No goals were recorded yet.");
    return lines.join("\n");
  }

  for (const goal of entries) {
    lines.push(
      `## ${goal.title}`,
      "",
      `- Area: ${goal.area}`,
      `- Timeframe: ${goal.timeframe}`,
      `- Status: ${goal.status}`,
      `- Importance: ${goal.importance}`,
      `- Progress: ${goal.progressPercent}%`,
      `- Tags: ${goal.tags.length > 0 ? goal.tags.join(", ") : "Not recorded"}`,
      `- Target date: ${goal.targetDate ?? "Not recorded"}`,
      `- Review interval (days): ${goal.reviewIntervalDays ?? "Not recorded"}`,
      `- Last reviewed at: ${goal.lastReviewedAt ?? "Not recorded"}`,
      `- Created at: ${goal.createdAt}`,
      `- Updated at: ${goal.updatedAt}`,
      "",
      formatBlock(goal.description, "Not recorded"),
      ""
    );
  }

  return lines.join("\n").trimEnd();
}

export function createJournalMarkdownExport(entries: JournalEntry[]): string {
  const lines = [
    "# AliOS Journal Export",
    "",
    `Exported at: ${new Date().toISOString()}`,
    `Entries: ${entries.length}`,
    "",
  ];

  if (entries.length === 0) {
    lines.push("No journal entries were recorded yet.");
    return lines.join("\n");
  }

  for (const entry of entries) {
    lines.push(
      `## ${entry.date} · ${entry.type} · ${entry.title}`,
      "",
      `- Mood: ${entry.moodLevel ?? "Not recorded"}`,
      `- Energy: ${entry.energyLevel ?? "Not recorded"}`,
      `- Created at: ${entry.createdAt}`,
      `- Updated at: ${entry.updatedAt}`,
      "",
      formatBlock(entry.content, "Not recorded"),
      ""
    );
  }

  return lines.join("\n").trimEnd();
}

export function createKnowledgeMarkdownExport(items: KnowledgeItem[]): string {
  const lines = [
    "# AliOS Knowledge Export",
    "",
    `Exported at: ${new Date().toISOString()}`,
    `Entries: ${items.length}`,
    "",
  ];

  if (items.length === 0) {
    lines.push("No knowledge items were recorded yet.");
    return lines.join("\n");
  }

  for (const item of items) {
    lines.push(
      `## ${item.title}`,
      "",
      `- Type: ${item.type}`,
      `- Summary: ${item.summary?.trim() || "Not recorded"}`,
      `- Source: ${item.source?.trim() || "Not recorded"}`,
      `- Created at: ${item.createdAt}`,
      `- Updated at: ${item.updatedAt}`,
      "",
      formatBlock(item.content, "Not recorded"),
      ""
    );
  }

  return lines.join("\n").trimEnd();
}

export function createManualMarkdownExport(entries: ManualEntry[]): string {
  const lines = [
    "# AliOS Personal Manual Export",
    "",
    `Exported at: ${new Date().toISOString()}`,
    `Entries: ${entries.length}`,
    "",
  ];

  if (entries.length === 0) {
    lines.push("No manual entries were recorded yet.");
    return lines.join("\n");
  }

  for (const entry of entries) {
    lines.push(
      `## ${entry.title}`,
      "",
      `- Category: ${entry.category}`,
      `- Status: ${entry.status}`,
      `- Importance: ${entry.importance}`,
      `- Tags: ${entry.tags.length > 0 ? entry.tags.join(", ") : "Not recorded"}`,
      `- Review interval (days): ${entry.reviewIntervalDays ?? "Not recorded"}`,
      `- Last reviewed at: ${entry.lastReviewedAt ?? "Not recorded"}`,
      `- Created at: ${entry.createdAt}`,
      `- Updated at: ${entry.updatedAt}`,
      "",
      formatBlock(entry.body, "Not recorded"),
      ""
    );
  }

  return lines.join("\n").trimEnd();
}

export function downloadTextExport(
  filename: string,
  content: string,
  mimeType: string
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
