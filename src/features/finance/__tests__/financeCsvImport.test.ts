import { describe, expect, it } from "vitest";

import {
  findFinanceCsvMappingPreset,
  guessFinanceCsvMapping,
  parseCsvTable,
  parseFinanceCsvRecords,
  shouldShowFinanceCsvImportReminder,
  upsertFinanceCsvMappingPreset,
  type FinanceCsvMappingPreset,
} from "../financeCsvImport";

describe("finance CSV import", () => {
  it("parses quoted CSV rows and maps signed amounts to transaction inputs", () => {
    const table = parseCsvTable(
      [
        "Date,Description,Amount",
        '2026-08-10,"Grocery, weekly",-42.75',
        "08/11/2026,Salary,5000",
      ].join("\n")
    );
    const mapping = guessFinanceCsvMapping(table.headers);
    const rows = parseFinanceCsvRecords(table.records, mapping);

    expect(mapping).toEqual({
      amount: "Amount",
      date: "Date",
      description: "Description",
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      input: {
        amount: 42.75,
        category: "groceries",
        occurredAt: "2026-08-10",
        title: "Grocery, weekly",
        type: "expense",
      },
      status: "valid",
    });
    expect(rows[1]).toMatchObject({
      input: {
        amount: 5000,
        category: "salary",
        occurredAt: "2026-08-11",
        title: "Salary",
        type: "income",
      },
      status: "valid",
    });
  });

  it("keeps malformed CSV records in the preview with row-level errors", () => {
    const table = parseCsvTable("Posted,Memo,Value\nnot-a-date,,abc");
    const rows = parseFinanceCsvRecords(
      table.records,
      guessFinanceCsvMapping(table.headers)
    );

    expect(rows).toEqual([
      {
        errors: ["description", "amount", "date"],
        index: 0,
        raw: {
          Memo: "",
          Posted: "not-a-date",
          Value: "abc",
        },
        status: "error",
      },
    ]);
  });

  it("matches and updates saved CSV mapping presets by normalized headers", () => {
    const preset: FinanceCsvMappingPreset = {
      id: "preset-1",
      name: "My bank",
      headers: ["Posted", "Memo", "Value"],
      mapping: {
        amount: "Value",
        date: "Posted",
        description: "Memo",
      },
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };

    expect(findFinanceCsvMappingPreset(["value", "memo", "posted"], [preset])).toEqual(
      preset
    );

    const updated = upsertFinanceCsvMappingPreset([preset], {
      ...preset,
      id: "new-id",
      mapping: {
        amount: "Debit",
        date: "Date",
        description: "Description",
      },
      updatedAt: "2026-08-02T00:00:00.000Z",
    });

    expect(updated).toEqual([
      expect.objectContaining({
        id: "preset-1",
        createdAt: "2026-08-01T00:00:00.000Z",
        mapping: {
          amount: "Debit",
          date: "Date",
          description: "Description",
        },
      }),
    ]);
  });

  it("shows the monthly CSV import reminder only when import state is stale", () => {
    const referenceDate = new Date("2026-08-16T12:00:00.000Z");

    expect(
      shouldShowFinanceCsvImportReminder({
        dismissedUntil: null,
        lastImportAt: null,
        referenceDate,
      })
    ).toBe(true);
    expect(
      shouldShowFinanceCsvImportReminder({
        dismissedUntil: null,
        lastImportAt: "2026-08-01T12:00:00.000Z",
        referenceDate,
      })
    ).toBe(false);
    expect(
      shouldShowFinanceCsvImportReminder({
        dismissedUntil: null,
        lastImportAt: "2026-07-01T12:00:00.000Z",
        referenceDate,
      })
    ).toBe(true);
    expect(
      shouldShowFinanceCsvImportReminder({
        dismissedUntil: "2026-08-20T12:00:00.000Z",
        lastImportAt: "2026-07-01T12:00:00.000Z",
        referenceDate,
      })
    ).toBe(false);
  });
});
