import { describe, expect, it } from "vitest";

import {
  createDecisionLogMarkdownExport,
  createFinanceCsvExport,
  createGoalsMarkdownExport,
  createJournalMarkdownExport,
  createKnowledgeMarkdownExport,
  createManualMarkdownExport,
  createReadableExportFilename,
} from "../exportCenter";
import {
  decisionLogRecord,
  financeObligationRecord,
  financeTransactionRecord,
  goalRecord,
  journalEntryRecord,
  knowledgeItemRecord,
  manualEntryRecord,
} from "@/test/factories";

describe("export center helpers", () => {
  it("creates stable readable export filenames", () => {
    expect(
      createReadableExportFilename(
        "decision-log",
        "md",
        new Date("2026-07-10T09:30:00.000Z")
      )
    ).toBe("alios-decision-log-export-2026-07-10-09-30.md");
  });

  it("creates a combined finance CSV export", () => {
    const csv = createFinanceCsvExport(
      [financeTransactionRecord],
      [financeObligationRecord]
    );

    expect(csv).toContain(
      "recordType,id,title,date,entryType,category,amount,totalAmount,paidAmount,dueAmount,monthlyAmount,dueDay,dueDate,counterparty,status,notes,createdAt,updatedAt"
    );
    expect(csv).toContain("transaction,fixture-id,Monthly salary,2026-07-05,income");
    expect(csv).toContain("obligation,fixture-id,Phone installment,2026-07-12,installment");
    expect(csv).toContain("Primary local income");
    expect(csv).toContain("Monthly installment for the phone");
  });

  it("creates a readable decision log markdown export", () => {
    const markdown = createDecisionLogMarkdownExport([decisionLogRecord]);

    expect(markdown).toContain("# AliOS Decision Log Export");
    expect(markdown).toContain("Entries: 1");
    expect(markdown).toContain("## Choose release focus");
    expect(markdown).toContain("- Decision date: 2026-07-05");
    expect(markdown).toContain("- Options:");
    expect(markdown).toContain("- Ship Decision Log foundation");
    expect(markdown).toContain("> We need to decide whether to prioritize review polish or dashboard tweaks.");
  });

  it("creates readable journal and knowledge markdown exports", () => {
    expect(createJournalMarkdownExport([journalEntryRecord])).toContain(
      "## 2026-07-05 · learning · Testing foundation"
    );
    expect(createKnowledgeMarkdownExport([knowledgeItemRecord])).toContain(
      "## Testing rule"
    );
  });

  it("creates a readable goals markdown export", () => {
    const markdown = createGoalsMarkdownExport([goalRecord]);

    expect(markdown).toContain("# AliOS Goals Export");
    expect(markdown).toContain("Entries: 1");
    expect(markdown).toContain("## Improve sleep");
    expect(markdown).toContain("- Area: health");
    expect(markdown).toContain("- Timeframe: quarter");
    expect(markdown).toContain("- Status: active");
    expect(markdown).toContain("- Importance: high");
    expect(markdown).toContain("- Progress: 35%");
    expect(markdown).toContain("- Tags: health, routine");
    expect(markdown).toContain("- Review interval (days): 7");
    expect(markdown).toContain("> Keep a regular bedtime and morning routine.");
  });

  it("creates a readable personal manual markdown export", () => {
    const markdown = createManualMarkdownExport([manualEntryRecord]);

    expect(
      createReadableExportFilename(
        "personal-manual",
        "md",
        new Date("2026-07-10T09:30:00.000Z")
      )
    ).toBe("alios-personal-manual-export-2026-07-10-09-30.md");
    expect(markdown).toContain("# AliOS Personal Manual Export");
    expect(markdown).toContain("Entries: 1");
    expect(markdown).toContain("## Personal planning rule");
    expect(markdown).toContain("- Category: principles");
    expect(markdown).toContain("- Status: active");
    expect(markdown).toContain("- Importance: high");
    expect(markdown).toContain("- Tags: planning, energy");
    expect(markdown).toContain("- Review interval (days): 7");
    expect(markdown).toContain("- Last reviewed at: 2026-07-04T08:30:00.000Z");
    expect(markdown).toContain("> Keep the next action small and local when energy is low.");
  });

  it("describes empty exports clearly", () => {
    expect(createDecisionLogMarkdownExport([])).toContain(
      "No decision log entries were recorded yet."
    );
    expect(createJournalMarkdownExport([])).toContain(
      "No journal entries were recorded yet."
    );
    expect(createKnowledgeMarkdownExport([])).toContain(
      "No knowledge items were recorded yet."
    );
    expect(createGoalsMarkdownExport([])).toContain(
      "No goals were recorded yet."
    );
    expect(createManualMarkdownExport([])).toContain(
      "No manual entries were recorded yet."
    );
  });
});

