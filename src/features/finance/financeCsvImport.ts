import type { CreateFinanceTransactionInput } from "@/core/repositories";

import { DEFAULT_FINANCE_TRANSACTION_CATEGORY } from "./domain/finance";

export type FinanceCsvMapping = {
  amount: string;
  date: string;
  description: string;
};

export type FinanceCsvParsedRow =
  | {
      index: number;
      input: CreateFinanceTransactionInput;
      raw: Record<string, string>;
      status: "valid";
    }
  | {
      errors: string[];
      index: number;
      raw: Record<string, string>;
      status: "error";
    };

export function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += character;
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export function parseCsvTable(content: string) {
  const rows = parseCsvRows(content);
  const headers = rows[0] ?? [];

  return {
    headers,
    records: rows.slice(1).map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
    ),
  };
}

export function guessFinanceCsvMapping(headers: readonly string[]): FinanceCsvMapping {
  const normalizedHeaders = headers.map((header) => header.toLocaleLowerCase());
  const findHeader = (candidates: readonly string[]) =>
    headers[
      normalizedHeaders.findIndex((header) =>
        candidates.some((candidate) => header.includes(candidate))
      )
    ] ?? "";

  return {
    amount: findHeader(["amount", "value", "debit", "credit", "مبلغ"]),
    date: findHeader(["date", "posted", "transaction date", "تاریخ"]),
    description: findHeader(["description", "details", "memo", "title", "شرح"]),
  };
}

function normalizeAmount(value: string) {
  const normalized = value.replace(/[^\d.,\-()]/g, "").replace(/,/g, "");
  const isParenthesized = normalized.startsWith("(") && normalized.endsWith(")");
  const parsed = Number(normalized.replace(/[()]/g, ""));

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return isParenthesized ? -Math.abs(parsed) : parsed;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) {
    return null;
  }

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const month = first > 12 ? second : first;
  const day = first > 12 ? first : second;
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function parseFinanceCsvRecords(
  records: readonly Record<string, string>[],
  mapping: FinanceCsvMapping
): FinanceCsvParsedRow[] {
  return records.map((record, index) => {
    const errors: string[] = [];
    const title = record[mapping.description]?.trim() ?? "";
    const amount = normalizeAmount(record[mapping.amount] ?? "");
    const occurredAt = normalizeDate(record[mapping.date] ?? "");

    if (!title) {
      errors.push("description");
    }
    if (amount === null || amount === 0) {
      errors.push("amount");
    }
    if (occurredAt === null) {
      errors.push("date");
    }

    if (errors.length > 0 || amount === null || occurredAt === null) {
      return {
        errors,
        index,
        raw: record,
        status: "error",
      };
    }

    const type = amount < 0 ? "expense" : "income";

    return {
      index,
      input: {
        amount: Math.abs(amount),
        category: DEFAULT_FINANCE_TRANSACTION_CATEGORY[type],
        occurredAt,
        title,
        type,
      },
      raw: record,
      status: "valid",
    };
  });
}
