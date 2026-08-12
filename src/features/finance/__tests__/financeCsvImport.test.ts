import { describe, expect, it } from "vitest";

import {
  guessFinanceCsvMapping,
  parseCsvTable,
  parseFinanceCsvRecords,
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
});
