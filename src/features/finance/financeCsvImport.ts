import type { CreateFinanceTransactionInput } from "@/core/repositories";
import {
  readStoredPreference,
  writeStoredPreference,
  type PreferenceStorage,
} from "@/shared/preferences/storage";

import { DEFAULT_FINANCE_TRANSACTION_CATEGORY } from "./domain/finance";

export type FinanceCsvMapping = {
  amount: string;
  date: string;
  description: string;
};

export type FinanceCsvMappingPreset = {
  id: string;
  name: string;
  headers: string[];
  mapping: FinanceCsvMapping;
  createdAt: string;
  updatedAt: string;
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

export const FINANCE_CSV_MAPPING_PRESETS_STORAGE_KEY =
  "alios.finance.csvImport.mappingPresets";
export const FINANCE_LAST_CSV_IMPORT_AT_STORAGE_KEY =
  "alios.finance.csvImport.lastImportAt";
export const FINANCE_CSV_IMPORT_REMINDER_DISMISSED_UNTIL_STORAGE_KEY =
  "alios.finance.csvImport.reminderDismissedUntil";

const IMPORT_REMINDER_THRESHOLD_DAYS = 30;
const IMPORT_REMINDER_DISMISS_DAYS = 7;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function normalizeHeaders(headers: readonly string[]): string[] {
  return headers.map((header) => header.trim().toLocaleLowerCase()).sort();
}

export function headersMatchFinanceCsvPreset(
  headers: readonly string[],
  preset: FinanceCsvMappingPreset
): boolean {
  return (
    JSON.stringify(normalizeHeaders(headers)) ===
    JSON.stringify(normalizeHeaders(preset.headers))
  );
}

function parseFinanceCsvMappingPresets(
  value: string | null | undefined
): FinanceCsvMappingPreset[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((preset): preset is FinanceCsvMappingPreset => {
      return (
        typeof preset?.id === "string" &&
        typeof preset.name === "string" &&
        Array.isArray(preset.headers) &&
        preset.headers.every((header: unknown) => typeof header === "string") &&
        typeof preset.mapping?.amount === "string" &&
        typeof preset.mapping.date === "string" &&
        typeof preset.mapping.description === "string" &&
        typeof preset.createdAt === "string" &&
        typeof preset.updatedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function parseStoredDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function readFinanceCsvMappingPresets(
  storage?: PreferenceStorage | null
): FinanceCsvMappingPreset[] {
  return readStoredPreference(
    FINANCE_CSV_MAPPING_PRESETS_STORAGE_KEY,
    parseFinanceCsvMappingPresets,
    [],
    storage
  );
}

export function writeFinanceCsvMappingPresets(
  presets: readonly FinanceCsvMappingPreset[],
  storage?: PreferenceStorage | null
) {
  writeStoredPreference(
    FINANCE_CSV_MAPPING_PRESETS_STORAGE_KEY,
    JSON.stringify(presets),
    storage
  );
}

export function findFinanceCsvMappingPreset(
  headers: readonly string[],
  presets: readonly FinanceCsvMappingPreset[]
): FinanceCsvMappingPreset | null {
  return presets.find((preset) => headersMatchFinanceCsvPreset(headers, preset)) ?? null;
}

export function createFinanceCsvMappingPreset({
  headers,
  mapping,
  name,
  referenceDate = new Date(),
}: {
  headers: readonly string[];
  mapping: FinanceCsvMapping;
  name: string;
  referenceDate?: Date;
}): FinanceCsvMappingPreset {
  const timestamp = referenceDate.toISOString();

  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    headers: [...headers],
    mapping,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function upsertFinanceCsvMappingPreset(
  presets: readonly FinanceCsvMappingPreset[],
  preset: FinanceCsvMappingPreset
): FinanceCsvMappingPreset[] {
  const existingIndex = presets.findIndex(
    (item) =>
      item.name.trim().toLocaleLowerCase() === preset.name.trim().toLocaleLowerCase() ||
      headersMatchFinanceCsvPreset(preset.headers, item)
  );

  if (existingIndex === -1) {
    return [...presets, preset];
  }

  return presets.map((item, index) =>
    index === existingIndex
      ? {
          ...preset,
          id: item.id,
          createdAt: item.createdAt,
        }
      : item
  );
}

export function readFinanceLastCsvImportAt(
  storage?: PreferenceStorage | null
): string | null {
  return readStoredPreference(
    FINANCE_LAST_CSV_IMPORT_AT_STORAGE_KEY,
    parseStoredDate,
    null,
    storage
  );
}

export function writeFinanceLastCsvImportAt(
  referenceDate = new Date(),
  storage?: PreferenceStorage | null
): string {
  const timestamp = referenceDate.toISOString();
  writeStoredPreference(FINANCE_LAST_CSV_IMPORT_AT_STORAGE_KEY, timestamp, storage);
  return timestamp;
}

export function readFinanceCsvImportReminderDismissedUntil(
  storage?: PreferenceStorage | null
): string | null {
  return readStoredPreference(
    FINANCE_CSV_IMPORT_REMINDER_DISMISSED_UNTIL_STORAGE_KEY,
    parseStoredDate,
    null,
    storage
  );
}

export function writeFinanceCsvImportReminderDismissal(
  referenceDate = new Date(),
  storage?: PreferenceStorage | null
): string {
  const dismissedUntil = new Date(
    referenceDate.getTime() + IMPORT_REMINDER_DISMISS_DAYS * DAY_IN_MILLISECONDS
  ).toISOString();
  writeStoredPreference(
    FINANCE_CSV_IMPORT_REMINDER_DISMISSED_UNTIL_STORAGE_KEY,
    dismissedUntil,
    storage
  );
  return dismissedUntil;
}

export function shouldShowFinanceCsvImportReminder({
  dismissedUntil,
  lastImportAt,
  referenceDate = new Date(),
}: {
  dismissedUntil: string | null | undefined;
  lastImportAt: string | null | undefined;
  referenceDate?: Date;
}): boolean {
  if (dismissedUntil) {
    const parsedDismissedUntil = new Date(dismissedUntil);
    if (
      !Number.isNaN(parsedDismissedUntil.getTime()) &&
      parsedDismissedUntil.getTime() > referenceDate.getTime()
    ) {
      return false;
    }
  }

  if (!lastImportAt) {
    return true;
  }

  const parsedImportDate = new Date(lastImportAt);
  if (Number.isNaN(parsedImportDate.getTime())) {
    return true;
  }

  return (
    referenceDate.getTime() - parsedImportDate.getTime() >
    IMPORT_REMINDER_THRESHOLD_DAYS * DAY_IN_MILLISECONDS
  );
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
